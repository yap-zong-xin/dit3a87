# SAP-DIT3A87-FYP


## Setup Guide
Follow these instructions step by step to successfully setup the project in your local machine.
### 1. Clone GitHub
### 2. Run "npm install"
### 3. Create new folder ".env"
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
### 5. Run "mongod" in powershell and "nodemon" in VSC terminal

## Chat Feature Setup
### 1. Navigate to chat/client/package.json, and change the proxy variable to "http://localhost:3000"
### 2. Make 2 new terminal windows in VSC.
### 3. In the 2 terminal windows, chat/client, and chat/socket respectively.
### 4. Run "npm install" in both terminal windows to install all the node modules.
### 5. Run "npm start" in both terminal windows to start up the chat feature.

## Register URL

* Seeker or Agent (/register)
* Admin (/register-admin)

## Errors
* If there's any error, you probably need to clear your local mongodb data by running "mongo" in another powershell and clear all the data under SAP database
