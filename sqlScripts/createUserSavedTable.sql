CREATE TABLE [dbo].[savedRecipes](
	[username] [varchar](8) NOT NULL,
	[recipeID] [int] NOT NULL,
	CONSTRAINT Saved_Recipe PRIMARY KEY (username, recipeID)
)

