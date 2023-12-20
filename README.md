
# Tweeder HTMX / Express 

This is a small project I wrote to experiment with HTMX; It uses a minimal custom framework built on top of ExpressJS. For more information see core/createView.ts

## Project setup
To get the project ready to run locally you'll need to ensure you have a Postgres database server available; I've included a docker-compose.yml file that you can use to quickly setup one locally.

Create an .env file with and add `DATABASE_URL=prisma connection string...` (If you used the docker compose file you can simply copy .env-sample to .env)

Then you just need to run the following commands from the project directory:

`$ npm install` to install all of the neccessary dependencies.

`$ npx prisma db push` to sync the database model with your server.

Once that's done you should just need to run `npm run dev` and open localhost:3000 in a web browser.

## Test accounts

You can create an account using the app or by running the following command:

`$ npm run createUser`

This will prompt you for some basic info and insert that user into the database.
