# SAP-DIT3A87-FYP

## Setup Guide
Follow these instructions step by step to successfully setup the project in your local machine.
### 1. Clone GitHub
Before running the web application, you must get the codes first. Head to GitHub and clone the repository using any method you like and save it into a folder.
### 2. Run "npm install"
Open the file location in command prompt and type in “npm install” assuming you have node.js installed in your machine. If not, please head to Node.JS to download and set up the program. It is required to run the application.
### 3. Create new file ".env" in the root of the project folder
After saving the codes in your local machine, you must save environment variables in a .env file as this specific file will not be in the repository for security reasons.
### 4. Add in .env codes:
```
MAPBOX_TOKEN=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
DB_URL=xxx
SECRET=xxx
REDIRECT_URI=xxx
REFRESH_TOKEN=xxx
CLIENT_ID=xxx
CLIENT_SECRET=xxx
```
Do note that these variables are linked to the project team’s accounts. When setting up, please use your own keys and tokens by creating an account under the respective platforms.
### 5. Run "mongod" in powershell and "nodemon" in VSC terminal
Assuming you have mongodb installed into your machine, you need to open a Microsoft Powershell window and run the command "mongod" to start the MongoDB database server in your machine.
The application requires you to run “nodemon” in the terminal for changes to be easily reflected in the loaded web page upon saving. To successfully run the command, install nodemon by typing “npm i -g nodemon”.
After installing nodemon, start the application by typing “nodemon” in the terminal to start the web application.

## Chat Feature Setup
1. Navigate to chat/client/package.json, and change the proxy variable to "http://localhost:3000"
2. Make 2 new terminal windows in VSC.
3. In the 2 terminal windows, cd into chat/client, and chat/socket respectively.
4. Run "npm install" in both terminal windows to install all the node modules.
5. Run "npm start" in both terminal windows to start up the chat feature.

## Register URL
* Seeker or Agent (/register)
* Admin (/register-admin)

## Errors
* If there's any error, you probably need to clear your local mongodb data by running "mongosh" in another powershell and clear all the data under SAP database
