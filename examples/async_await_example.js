async function displayUser() {
  try {
    const user = await getUser(1);
    console.log(user);
  } catch (error) {
    console.log(error.message);
  }
}

async function getUser(id) {
  // find user
  const user = { userId: id, name: "Eran" };
  if (user) return user;
  else throw new Error("user not found");
}

displayUser();
