CREATE TABLE [dbo].[ourDbRecipes](
        [recipeID] [int] NOT NULL PRIMARY KEY IDENTITY (10000000,1),
        [image_url] [varchar](300),
        [title] [varchar](100),
        [prepTime] [varchar](100),
        [popularity] [int],
        [vegan] [BIT],
        vegetarian [BIT],
        [glutenFree] [BIT],
        [url] [varchar](300),
        [instructions_id] [int],
        [ingredients_id] [int],
        [num_of_dishes] [int],

)


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
      [from_whom] [varchar](10),
      [special_time] [varchar](100),
      [family_image] [varchar](300)
      CONSTRAINT PK_Family_Recipe PRIMARY KEY (username, recipeID)
)
