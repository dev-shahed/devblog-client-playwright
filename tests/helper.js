const { test, expect } = require('@playwright/test');

const loginUser = async (page, username, password) => {
  test.setTimeout(10000);
  await page.getByRole('button', { name: 'Login' }).click();
  const signInTextLocator = page.getByText('Sign in to your account');
  await expect(signInTextLocator).toBeVisible();
  await page.getByLabel('Email or Username', { timeout: 5000 }).fill(username);
  await page.getByLabel('Password', { timeout: 5000 }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click('#trigger-swal');
};

const createBlog = async (page, title, author, url) => {
  test.setTimeout(10000);
  await page.getByRole('button', { name: 'Add New Blog' }).click();
  await page.getByPlaceholder('Title', { timeout: 5000 }).fill(title);
  await page.getByPlaceholder('Author', { timeout: 5000 }).fill(author);
  await page.getByPlaceholder('URL', { timeout: 5000 }).fill(url);
  await page.getByRole('button', { name: 'Add Blog' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
};

const handleModalView = async (page, modalTitle, modalText) => {
  await expect(page.getByText(modalTitle)).toBeVisible();
  await expect(page.getByText(modalText)).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
};

//Make a test that ensures that the user who added the blog can delete the blog. If you use the window.confirm dialog in the delete operation, you may have to Google how to use the dialog in the Playwright tests.




module.exports = {
  loginUser,
  createBlog,
  handleModalView,
};
