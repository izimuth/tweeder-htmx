
import { prisma } from '@/prisma';
import express from 'express';
import { number, object, string } from 'yup';

const router = express.Router();

const CreatePostSchema = object({
	content: string().required().max(250),
	inReplyTo: number().optional(),
})

// create a new post
router.post('/', async (req, res, next) => {
	try
	{
		const { content, inReplyTo } = CreatePostSchema.validateSync(req.body);
		
		await prisma.post.create({
			data: {
				userId: req.currentUser!.id,
				replyToPostId: inReplyTo, 
				postedOn: new Date(),
				content,
			}
		});

		res.status(204).end();
	}
	catch(err)
	{
		next(err);
	}
});

// toggle a post as liked by the current user
router.post('/like/:id', async (req, res, next) => {
	try
	{
		const postId = parseInt(req.params.id, 10);
		const post = await prisma.post.findUnique({
			where: { id: postId }
		});

		let didLike = false;

		if (!post)
		{
			res.status(404).send('Post not found');
			return;
		}

		// see if the user already likes this post
		const current = await prisma.postLike.findFirst({
			where: { 
				userId: req.currentUser!.id,
				postId: post.id,
			}
		});

		// clear current likes, just to make sure we remove any duplicates
		// probably not the greatest approach for a real app 
		await prisma.postLike.deleteMany({
			where: {
				userId: req.currentUser!.id,
				postId: post.id
			}
		});

		// if the user doesn't already like the post then create a new like entry
		if (!current)
		{
			await prisma.postLike.create({
				data: {
					postId: post.id,
					userId: req.currentUser!.id,
					likedOn: new Date(),
				}
			});

			didLike = true;
		}

		// get new like count
		const likeCount = await prisma.postLike.count({
			where: { postId: post.id }
		});

		// update like count
		await prisma.post.update({
			where: { id: post.id },
			data: { numLikes: likeCount }
		});

		res.send({
			didLike,
			numLikes: likeCount
		});
	}
	catch(err)
	{
		next(err);
	}
})

export default router;