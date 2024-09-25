const {
  test,
  expect,
  describe,
  beforeEach,
  evaluateAll,
} = require('@playwright/test');
const { loginUser, createBlog, handleModalView } = require('./helper');

// test.use({ storageState: 'empty' });

describe('Blog App Test', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset');
    await request.post('/api/users', {
      data: {
        name: 'Jhon',
        username: 'Jhon',
        password: 'jhonPass123#',
      },
    });
    await page.goto('/');
  });

  test('font page can be open', async ({ page }) => {
    const blogsHeadingLocator = page.getByRole('heading', { name: 'Blogs' });
    await expect(blogsHeadingLocator).toBeVisible();

    const signInTextLocator = page.getByText(
      'Login to your account to add and view blogs'
    );
    await expect(signInTextLocator).toBeVisible();

    const blogListLocator = page.getByText('No blogs found.');
    await expect(blogListLocator).toBeVisible();

    const loginButtonLocator = page.getByRole('button', { name: 'Login' });
    await expect(loginButtonLocator).toBeVisible();
  });

  test('fill the login form and log in', async ({ page }) => {
    await loginUser(page, 'Jhon', 'jhonPass123#');
    // Make sure the modal is visible and then click the "OK" button
    await handleModalView(page, 'Success!', 'Logged in successfully');
    await expect(page.getByText('Logged-in: Jhon')).toBeVisible();
  });

  test('login fails with bad credentials', async ({ page }) => {
    await loginUser(page, 'Jhon', 'jhonPass12345#');
    await handleModalView(page, 'Error!', 'Invalid username or password');
  });

  /**
   * Tests for the "when logged in" scenario in the blog app.
   */

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      test.setTimeout(10000);
      await loginUser(page, 'Jhon', 'jhonPass123#');
      await handleModalView(page, 'Success!', 'Logged in successfully');
    });

    test('can navigate to add blog page', async ({ page }) => {
      await page.getByRole('button', { name: 'Add New Blog' }).click();
      const addBlogHeading = page.getByRole('heading', { name: 'Add Blog' });
      await expect(addBlogHeading).toBeVisible();
    });

    test('can create a new blog', async ({ page }) => {
      await createBlog(
        page,
        'Blog created by Playwright',
        'Test Author',
        'https://test.com'
      );
      const createdBlog = page.getByText('Blog created by Playwright');
      await expect(createdBlog).toBeVisible();
    });

    test('a block can be liked', async ({ page }) => {
      test.setTimeout(10000); // Extending test timeout for longer operations
      await createBlog(
        page,
        'Blog created by Playwright',
        'Test Author',
        'https://test.com'
      );
      const createdBlog = page.getByText('Blog created by Playwright');
      await expect(createdBlog).toBeVisible();
      // Step 1: Locate and click the "Show" button for the specific blog
      await expect(page.getByText('Blog created by Playwright')).toBeVisible();
      const showButton = page.locator('#showBtn');
      await showButton.click();

      // Step 2: Locate and click the "Like" button
      const likeButton = page.locator('#likebtn');
      await likeButton.click();

      // Step 3: Verify the likes count is initially '0'
      await expect(page.locator('#count')).toHaveText('0');

      // Step 4: Ensure the "Likes: 1" text is visible after clicking
      await expect(page.getByText('Likes: 1')).toBeVisible();

      // Step 5: Click the "Hide" button to collapse the blog details
      const hideButton = page.locator('#hideBtn');
      await hideButton.click();
    });
  });

  test('a blog can be deleted by the user who added it', async ({ page }) => {
    // Assert the login button is visible and log in
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await loginUser(page, 'Jhon', 'jhonPass123#');
    await handleModalView(page, 'Success!', 'Logged in successfully');

    // Create and assert visibility of the blog
    await createBlog(
      page,
      'Blog created by Playwright 5',
      'Test Author',
      'https://test.com'
    );
    const createdBlog = page.getByText('Blog created by Playwright 5');
    await expect(createdBlog).toBeVisible();

    //show details of the blog and then delete it
    await page.locator('#showBtn').click();
    await page.locator('#deleteBtn').click(); // Trigger the deletion confirmation modal

    // Wait for the modal and assert visibility
    await expect(
      page.getByText('Are you sure you want to delete this blog?')
    ).toBeVisible({ timeout: 10000 });

    // Click the Delete button in the modal
    await page.locator('.swal2-confirm').click();

    await handleModalView(page, 'Success!', 'Blog deleted successfully');
    // Assert the blog is no longer visible after deletion
    await expect(createdBlog).toBeHidden();
  });

  // check if the blog is arrange by the likes count.
  test('blogs are arranged in the order according to the likes', async ({
    page,
  }) => {
    await loginUser(page, 'Jhon', 'jhonPass123#');
    await handleModalView(page, 'Success!', 'Logged in successfully');

    // Create blogs with varying likes
    const blogsToCreate = [
      { title: 'Most Liked Blog', likes: 10 },
      { title: 'Medium Liked Blog', likes: 5 },
      { title: 'Least Liked Blog', likes: 2 },
    ];

    for (const blog of blogsToCreate) {
      await createBlog(page, blog.title, 'Test Author', 'https://test.com', {
        likes: blog.likes,
      });
    }

    // Reload the page to fetch the latest blogs
    await page.reload();

    // Retrieve all blog elements
    const blogElements = page.locator('.blog-items');
    await expect(blogElements).toHaveCount(3);

    // Fetch the displayed blogs and their like counts
    const blogsWithLikes = await blogElements.evaluateAll((blogs) => {
      return blogs.map((blog) => ({
        title: blog.querySelector('.blog-title').innerText,
        likes: parseInt(blog.querySelector('#count').innerText, 10),
      }));
    });

    // Sort blogs by likes in descending order
    const sortedBlogs = blogsWithLikes.sort((a, b) => b.likes - a.likes);

    // Assert that the displayed blogs are in the correct order
    for (let i = 0; i < sortedBlogs.length; i++) {
      await expect(blogElements.nth(i).locator('.blog-title')).toHaveText(
        sortedBlogs[i].title
      );
      await expect(blogElements.nth(i).locator('#count')).toHaveText(
        sortedBlogs[i].likes.toString()
      );
    }
  });
});
