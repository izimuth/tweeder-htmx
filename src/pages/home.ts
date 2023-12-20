
import { Router } from 'express';
import { User } from '@prisma/client';

import nj from '@/core/templating';
import getCurrentUser from '@/middleware/getCurrentUser';
import { prisma } from '@/prisma';
import { createAsyncMemo } from '@/core/memo';
import { createView } from '@/core/createView';

export default (app: Router, path: string) => createView(app, {
	basePath: path,
	middleware: [
		getCurrentUser(true),
	],
	data(req)
	{
		return {
			getFeed: createAsyncMemo(async () => {
				const following = (await prisma.userAssociation.findMany({
					where: {
						type: 'FOLLOWS',
						sourceUserId: req.currentUser!.id,
					}
				})).map(u => u.targetUserId);

				return await prisma.post.query({
					where: {
						userId: [req.currentUser!.id, ...following],
					},
					likedBy: req.currentUser!.id,
					take: 20,
				});
			})
		}
	},
	fragments: {
		async feed() {
			const posts = await this.data?.getFeed();
			return await nj.renderAsync('home/feed.html', { posts });
		},

		async main(user: User) {
			return await nj.renderAsync('home/index.html', {
				feed: await this.fragments.feed(),
				currentUser: user,
			});
		}
	},
	mount: {
		'/': async function(req, res) {
			res.send(await this.fragments.main(req.currentUser!));
		},

		'/feed': async function (req, res, next) {
			res.send(await this.fragments.feed());
		}
	}
});
