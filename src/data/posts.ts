
import { prisma } from "@/prisma"
import { Post, Prisma, User } from "@prisma/client";

type PostQueryResult = Post & { 
	author: Pick<User, 'id' | 'displayName' | 'username'>;
	numReplies: number;
	doesLike: boolean 
};

type PostsByUserOptions = {
	likedBy?: number;
	take?: number;
	offset?: number;
};

type PostQuery = {
	where: {
		userId?: number | number[];
		username?: string | string[];
		between?: [Date, Date];
		inReplyTo?: number;
	},
	likedBy?: number;
	take?: number;
	offset?: number;
};

export default {
	async query(query: PostQuery)
	{
		let cols = Prisma.sql`p.*, a."displayName" AS "authorDisplayName", a.username AS "authorUsername"`;
		let where = Prisma.sql`a."isActive" = true`;

		// add reply count
		cols = Prisma.sql`${cols}, (SELECT COUNT(*) FROM "Post" WHERE "replyToPostId" = p.id) AS "numReplies"`;

		// see if posts were liked by the given user
		if (query.likedBy)
			cols = Prisma.sql`${cols}, (SELECT COUNT(id) > 0 FROM "PostLike" WHERE "postId" = p.id AND "userId" = ${query.likedBy}) AS "doesLike"`;

		// filter by user id 
		if (query.where.userId != undefined)
		{
			if (query.where.userId instanceof Array)
				where = Prisma.sql`${where} AND p."userId" = ANY(${query.where.userId})`;
			else
				where = Prisma.sql`${where} AND p."userId" = ${query.where.userId}`;
		}
		// or filter by username
		else if (query.where.username)
		{
			if (query.where.username instanceof Array)
				where = Prisma.sql`${where} AND a.username = ANY(${query.where.username})`;
			else
				where = Prisma.sql`${where} AND a.username = ${query.where.username}`;
		}

		// add date filter
		if (query.where.between)
		{
			const [from, to] = query.where.between;
			where = Prisma.sql`${where} AND (postedOn >= ${from} AND postedOn < ${to})`;
		}

		// find replies to post
		if (query.where.inReplyTo)
		{
			where = Prisma.sql`${where} AND p."replyToPostId" = ${query.where.inReplyTo}`;
		}

		const queryStr = Prisma.sql`
			SELECT ${cols}
			FROM "Post" AS p
			JOIN "User" AS a ON a.id = p."userId"
			WHERE ${where}
			ORDER BY "postedOn" DESC 
			LIMIT ${query?.take ?? 100}
			OFFSET ${query?.offset ?? 0}
		`;

		const result = await prisma.$queryRaw<Array<any>>(queryStr);

		return result.map(rec => ({
			id: rec.id,
			content: rec.content,
			postedOn: rec.postedOn,
			userId: rec.userId,
			numLikes: rec.numLikes,
			doesLike: rec.doesLike ?? false,
			numReplies: rec.numReplies,
			author: {
				id: rec.userId,
				displayName: rec.authorDisplayName,
				username: rec.authorUsername
			}
		}));		
	},

	async byUser(username: string, options?: PostsByUserOptions)
	{
		return await prisma.post.query({
			where: { username: [username] },
			likedBy: options?.likedBy,
			take: options?.take,
			offset: options?.offset,
		});
	},

}