CREATE TABLE [dbo].[users](
	[user_id] [UNIQUEIDENTIFIER] PRIMARY KEY NOT NULL default NEWID(),
	[username] [varchar](8) NOT NULL UNIQUE,
	[password] [varchar](300) NOT NULL,
	[firstName] [varchar](300) NOT NULL,
	[lastName] [varchar](300) NOT NULL,
	[email] [varchar](320) NOT NULL,
	[profilePicUrl] [varchar](1024) NOT NULL,
	[country] [varchar](300) NOT NULL
)





/*
 "first-name": "John",
    "last-name": "Doe",
    "password": "Mashu123!",
    "email": "john.doe@gmail.com",
    "profile-pic":
 */
