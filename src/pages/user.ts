import { Router } from "express";

import nj from '@/core/templating';
import createPage from "@/core/createPage";
import getCurrentUser from "@/middleware/getCurrentUser";
import { prisma } from "@/prisma";
import { createAsyncMemo } from "@/core/memo";
import { createView } from "@/core/createView";
import { Post, Prisma } from "@prisma/client";

export default (app: Router, basePath: string) => createView(app, {
	basePath,
	middleware: [ getCurrentUser(true) ],
	data(req) {
		return {
			currentUser: () => req.currentUser!,

			// get current user from request
			getUser: createAsyncMemo(async () => {
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
	
			// get user's posts from request
			getPosts: createAsyncMemo(async () => {
				const posts = await prisma.post.byUser(req.params.username, {
					likedBy: req.currentUser?.id,
					take: 100,
				});

				return posts;
			}),

			// get user's followers
			getFollowers: createAsyncMemo(async (id: number) => {
				const users = await prisma.userAssociation.findMany({
					where: {
						type: 'FOLLOWS',
						targetUserId: id,
					},
					include: {
						sourceUser: true
					}
				});

				return users.map(u => u.sourceUser);
			}),

			// get accounts this user is following
			getFollowing: createAsyncMemo(async (id: number) => {
				const users = await prisma.userAssociation.findMany({
					where: {
						type: 'FOLLOWS',
						sourceUserId: id,
					},
					include: {
						targetUser: true
					}
				});

				return users.map(u => u.targetUser);
			}),
		}
	},
	fragments: {
		// render user's profile
		async profile() { 
			return nj.render('user/profile.html', {
				currentUser: this.data!.currentUser(),
				user: await this.data!.getUser(),
			});
		},

		// render user's posts
		async posts() {
			return nj.render('user/posts.html', {
				user: await this.data!.getUser(),
				posts: await this.data!.getPosts(),
			});
		},

		// connected users
		async connections(type: string)
		{
			const user = await this.data!.getUser();
			let users: any;

			if (type == 'following')
			{
				users = await this.data?.getFollowing(user.id);
				type = 'Following';
			}
			else if (type == 'followers')
			{
				users = await this.data?.getFollowers(user.id);
				type = 'Followers';
			}

			return nj.render('user/connections.html', {
				users,
				currentUser: this.data!.currentUser(),
				profile: await this.fragments.profile(),
				connectionType: type,
			});
		},

		// main fragment
		async main() {
			return nj.render('user/index.html', {
				currentUser: this.data!.currentUser(),
				user: await this.data!.getUser(),
				profile: await this.fragments.profile(),
				posts: await this.fragments.posts(),
			})
		},
	},
	mount: {
		// mount fragments
		'/': 'main',
		'/posts': 'posts',
		'/profile': 'profile',

		'/followers': async function(req, res, next) {
			try
			{
				const content = await this.fragments.connections('followers');
				res.send(content);
			}
			catch(err)
			{
				next(err);
			}
		},

		'/following': async function(req, res, next) {
			try
			{
				const content = await this.fragments.connections('following');
				res.send(content);
			}
			catch(err)
			{
				next(err);
			}
		},

		// api calls to follow/unfollow this user
		'/api/follow': {
			method: 'post',
			async handler(req, res, next) {
				const user = await prisma.user.findUniqueOrThrow({
					where: { username: req.params.username }
				});

				await prisma.userAssociation.follow(req.currentUser!.id, user.id);

				res.send(204);
			}
		},
		'/api/unfollow': {
			method: 'post',
			async handler(req, res, next) {
				const user = await prisma.user.findUniqueOrThrow({
					where: { username: req.params.username }
				});

				await prisma.userAssociation.unfollow(req.currentUser!.id, user.id);

				res.send(204);
			}
		}
	}
});

