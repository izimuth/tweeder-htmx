import { PrismaClient } from "@prisma/client";

import postModel from '@/data/posts';

export const prisma = new PrismaClient({ errorFormat: 'minimal' }).$extends({
	model: {
		post: postModel,
		
		user: {
			async isFollowing(sourceId: number, targetId: number)
			{
				// you cannot follow yourself!
				if (sourceId == targetId)
					return false;

				const assoc = await prisma.userAssociation.count({
					where: {
						type: 'FOLLOWS',
						sourceUserId: sourceId,
						targetUserId: targetId,
					}
				});

				return assoc > 0;
			},
		},

		userAssociation: {
			follow(sourceId: number, targetId: number)
			{
				return prisma.userAssociation.create({
					data: {
						sourceUserId: sourceId,
						targetUserId: targetId,
						type: 'FOLLOWS',
					}
				})
			},

			unfollow(sourceId: number, targetId: number)
			{
				return prisma.userAssociation.deleteMany({
					where: {
						sourceUserId: sourceId,
						targetUserId: targetId,
						type: 'FOLLOWS',
					}
				})
			},

			async connections(userId: number)
			{
				return {
					numFollowers: await prisma.userAssociation.count({
						where: { targetUserId: userId, type: 'FOLLOWS' },
					}),

					numFollowing: await prisma.userAssociation.count({
						where: { sourceUserId: userId, type: 'FOLLOWS' },
					}),
				}
			}
		}
	}
})