CREATE TABLE [dbo].[recipes](
	[recipe_id] [UNIQUEIDENTIFIER] NOT NULL default NEWID(),
	[author] [UNIQUEIDENTIFIER] NOT NULL,
	[recipe_name] [varchar](300) NOT NULL,
	PRIMARY KEY (author, recipe_name),
	FOREIGN KEY (author) REFERENCES users(user_id)
)