CREATE TABLE [dbo].[ourDbRecipes](
        [recipeID] [int] NOT NULL PRIMARY KEY IDENTITY (10000000,1),
        [image_url] [varchar](300) NOT NULL,
        [title] [varchar](100) NOT NULL,
        [prepTime] [varchar](100) NOT NULL,
        [popularity] [int] NOT NULL,
        [vegan] [BIT] NOT NULL,
        vegetarian [BIT] NOT NULL,
        [glutenFree] [BIT] NOT NULL,
        [url] [varchar](300) NOT NULL,
        [num_of_dishes] [int] NOT NULL,

)


INSERT INTO [dbo].ourDbRecipes VALUES ("hujh", "title", "18 min", 178, TRUE, TRUE, TRUE, url, 9);


CREATE TABLE [dbo].[recipeInstructions](
        [instruction_id] [int] NOT NULL,
        [step] [int] NOT NULL,
        [step_instruction] [varchar](100),
        [recipeID] [int] NOT NULL FOREIGN KEY REFERENCES ourDbRecipes(recipeID),

        CONSTRAINT PK_Instruction_Step PRIMARY KEY (instruction_id, step)
)

CREATE TABLE [dbo].[recipeIngredients](
       [ingredients_id] [int] NOT NULL,
       [name] [varchar](20) NOT NULL,
       [count] [varchar](100),
       [recipeID] [int] NOT NULL FOREIGN KEY REFERENCES ourDbRecipes(recipeID),

       CONSTRAINT PK_Ingredients PRIMARY KEY (ingredients_id, name)
)

CREATE TABLE [dbo].[familyRecipes](
      [username] [varchar](8) NOT NULL,
      [recipeID] [int] NOT NULL FOREIGN KEY REFERENCES ourDbRecipes(recipeID),
      [from_whom] [varchar](30) NOT NULL,
      [special_time] [varchar](100) NOT NULL,
      [family_image] [varchar](300) NOT NULL
      CONSTRAINT PK_Family_Recipe PRIMARY KEY (username, recipeID)
)
