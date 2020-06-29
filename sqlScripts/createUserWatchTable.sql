CREATE TABLE [dbo].[watchedRecipes](
	[username] [varchar](8) NOT NULL,
	[recipeID] [int] NOT NULL,
	CONSTRAINT Watched_Recipe PRIMARY KEY (username, recipeID)
)

Alter table watchedRecipes add last_time_watched timestamp

Alter table watchedRecipes drop column last_watched
Alter table watchedRecipes add last_watched datetime2 not null default GETDATE()
Alter table watchedRecipes drop column last_time_watched

insert into watchedRecipes (username, recipeID) values ('gal', '10000009')
