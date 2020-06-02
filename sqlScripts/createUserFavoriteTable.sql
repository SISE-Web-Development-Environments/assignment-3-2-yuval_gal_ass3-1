CREATE TABLE [dbo].[favoriteRecipe](
	[username] [varchar](8) NOT NULL,
	[recipeID] [int] NOT NULL,
	CONSTRAINT Fav_Recipe PRIMARY KEY (username, recipeID)
)

