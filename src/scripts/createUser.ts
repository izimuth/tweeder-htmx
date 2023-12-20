
import 'dotenv/config';	
import bcrypt from 'bcrypt';
import { createInterface } from 'readline';
import { prisma } from '../prisma';

const readline = createInterface({
	input: process.stdin,
	output: process.stdout
});

function getAnswerFor(query: string)
{
	return new Promise<string>((resolve, reject) => {
		readline.question(query, answer => {
			if (answer.trim())
			{
				resolve(answer);
			}
			else
			{
				reject(new Error('Value cannot be empty'));
			}
		});
	});
}

async function seedDb()
{
	try
	{
		const email = await getAnswerFor('Email address: ');
		const password = await getAnswerFor('Password: ');
		const displayName = await getAnswerFor('Display name: ');
		const username = await getAnswerFor('Username: ');

		const hashedPassword = bcrypt.hashSync(password, 10);

		await prisma.user.create({
			data: {
				email,
				displayName,
				username,
				password: hashedPassword,
			}
		});

		console.log('User added');
	}
	finally
	{
		readline.close();
		await prisma.$disconnect();
	}
}

seedDb();


