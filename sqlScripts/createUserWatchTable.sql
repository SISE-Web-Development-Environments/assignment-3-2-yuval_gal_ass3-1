CREATE TABLE [dbo].[watchedRecipes](
	[username] [varchar](8) NOT NULL,
	[recipeID] [int] NOT NULL,
	CONSTRAINT Watched_Recipe PRIMARY KEY (username, recipeID)
)
