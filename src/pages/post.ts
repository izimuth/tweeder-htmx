import { Router } from "express";

import getCurrentUser from "@/middleware/getCurrentUser";
import nj from '@/core/templating';
import { createView } from "@/core/createView";
import { prisma } from "@/prisma";
import { createAsyncMemo } from "@/core/memo";

export default (app: Router, basePath: string) => createView(app, {
	basePath,
	middleware: [
		getCurrentUser(true),
	],
	data(req) {
		return {
			currentUser: req.currentUser,

			getAuthor: createAsyncMemo(async function(){
				// get the user being viewed
				const user = await prisma.user.findUniqueOrThrow({
					where: { username: req.params.username, isActive: true }
				});
	
				return {
					...user, 
	
					// get num following/followers
					connections: await prisma.userAssociation.connections(user.id),
	
					// also include following status
					following: await prisma.user.isFollowing(req.currentUser!.id, user.id)
				};
			}),

			getPost: createAsyncMemo(async function(){
				const post = await prisma.post.findUnique({
					where: {
						id: parseInt(req.params.id, 10),
						author: {
							username: req.params.username,
							isActive: true,
						}
					},
					select: {
						id: true,
						content: true,
						postedOn: true,
						author: true,
						numLikes: true,
					}
				});

				const doesLike = await prisma.postLike.count({
					where: { 
						postId: post?.id,
						userId: req.currentUser!.id,
					}
				});

				return {
					...post,
					doesLike: doesLike > 0
				}
			}),

			getReplies: createAsyncMemo(async function(){
				const replies = await prisma.post.query({
					where: { 
						inReplyTo: parseInt(req.params.id, 10)
					},
					take: 20,
					offset: 0,
				});

				return replies;
			}),
		}
	},
	fragments: {
		async profile()
		{
			const user = await this.data?.getAuthor();

			return nj.render('user/profile.html', {
				currentUser: this.data?.currentUser,
				user,
			});
		},

		async post()
		{
			const post = await this.data?.getPost();
			return nj.render('post/post.html', { post });
		},

		async replies()
		{
			const replies:any = await this.data?.getReplies() ?? [];
			
			return nj.render('post/replies.html', { posts: replies });
		},

		async main() 
		{
			const post = await this.data?.getPost();

			return nj.render('post/index.html', {
				post,
				currentUser: this.data?.currentUser,
				profile: await this.fragments.profile(),
				postContent: await this.fragments.post(),
				replies: await this.fragments.replies(),
			});
		},
	},
	mount: {
		'/': async function (req, res) {
			const post = await this.data?.getPost();

			if (post)
			{
				res.send(await this.fragments.main());
			}
			else
			{
				res.status(404).send(nj.render('errors/404.html', {
					message: 'Post not found'
				}));
			}
		},

		'/replies': 'replies'
	}
})
