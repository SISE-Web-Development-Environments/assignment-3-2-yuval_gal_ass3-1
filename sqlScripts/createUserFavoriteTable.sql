CREATE TABLE [dbo].[favoriteRecipes](
	[username] [varchar](8) NOT NULL,
	[recipeID] [int] NOT NULL,
	CONSTRAINT Fav_Recipe PRIMARY KEY (username, recipeID)
)

