// …or create a new repository on the command line
// echo "# Natours" >> README.md
// git init
// git add README.md
// git commit -m "first commit"
// …or push an existing repository from the command line
// git remote add origin https://github.com/devakibendalam/Natours.git
// git branch -M main
// git push -u origin main

// git add readme.md
// git commit -m "Added a readme"
// git push origin master

// HEROKU platform works very colselywith git.
// Git and GitHub Introduction:
// Purpose: Git is a version control software that helps manage code changes over time.
// GitHub: A platform to host Git repositories for collaboration and version control.
// GitHub Usage: Platform to host, share, and collaborate on Git repositories.

// Git Basics:
// Version Control: Git allows saving snapshots of code over time through commits and branches.
// Repositories: Each project has its own repository, where code history is managed.

// Configuration:
// Set up local Git configuration with name and email using git config commands.
// Global Configuration: git config --global user.name "Your Name" and git config --global user.email "your.email@example.com".

// Git FUNDAMENTALS:
// Git Initialization:
// Use git init to initialize a new Git repository in the local project folder.
// This creates an empty Git repository or "repo."

// Gitignore File:
// Create a .gitignore file to list files and folders to be ignored by Git.
// Common entries include node_modules and .env files.

// Staging Area:
// Before committing, use the staging area to selectively add files for the next commit.
// git add -A adds all files to the staging area.

// Committing Changes:
// Use git commit -m "Commit message" to commit staged changes.
// Commit messages should be descriptive of the changes made.

// Version Control:
// Commits serve as snapshots of the code at specific points in time.
// Git allows tracking changes, reverting, and navigating through commit history.

// Branching :
// primarily works on the master branch.
// Branches are essential for more complex collaborative workflows.

// Example Workflow:

// Initialize Git Repository: git init
// Create .gitignore: Create a file named .gitignore and add entries like node_modules/ and *.env.
// Staging and Committing: Use git add -A to stage all changes.
// Commit changes with git commit -m "Initial commit".
// Viewing Changes: Use git status to check modified files. Use git log to view commit history.
// Editing and Committing Again: Make changes to a file (e.g., app.js).
// Stage and commit changes again with appropriate messages.
// Branch Information:
// git branch shows the current branch (master in this case).

// 221 - Pushing to GitHub:
// pushing code to GitHub, specifically to a remote branch. So that  create new repository on GitHub(initializing the repository without a README file).
// Connecting Local and Remote Repositories:

// Connect the local repository with the remote repository on GitHub.
// git remote add origin https://github.com/devakibendalam/Natours.git  -> this command used to add a remote branch, typically named 'origin.'

// Pushing Code to GitHub using  the  command -> git push origin master
// the pull operation, which is useful when working on multiple computers.
// Modifying and committing changes locally involves Git commands like git add, git commit, and git push.

// Creating a README File
// Create a README file in the project directory (e.g., readme.md).
// Use Markdown syntax for formatting.
// Add a title, description, and technologies used.
// git add readme.md
// git commit -m "Added a readme"
// git push origin master

// Introduction to CORS:
// CORS stands for Cross-Origin Resource Sharing.
// It's a crucial feature for APIs allowing secure access from different domains.
// Cross-origin requests occur when a client from one domain tries to access an API on a different domain.

// Default Restrictions:
// Cross-origin requests are usually not allowed for security reasons.
// Without CORS implementation, these requests would fail by default.

// Example Scenario:
// Consider an API at natours-jonas.herokuapp.com/api/v1.
// Another website, e.g., example.com, attempts to access this API.
// This is a cross-origin request and, by default, would be blocked.

// CORS Implementation:
// CORS is implemented to allow cross-origin requests explicitly.
// It's crucial when making the API available to different websites.

// Browser Restrictions:
// CORS restrictions apply to requests made from the browser, not the server.
// Cross-origin includes different domains, subdomains, protocols, and ports.

// Native JavaScript Fetch Function:
// Fetch is a function similar to axios library but its native JavaScript in browser.
// Attempting a request  using the fetch function to the API in the browser console resulted in a CORS policy error.

// CORS Middleware with Node.js and Express:
// Installed the CORS package using npm install cors.
// Implemented CORS middleware in the Express application using app.use(cors()).
// Middleware added globally to allow CORS for all incoming requests.

// Implemeting CORS
// This enabling CORS for all incoming requests means for our entire API
app.use(cors()); // intern will return a middleware function which is then gonna add a couple of different headers to our response.  means that the cors() middleware, when applied, returns a function that acts as middleware. This function, when executed during an incoming request, will modify the response headers by adding specific CORS-related headers, facilitating Cross-Origin Resource Sharing for the API.

// We can also enable cors on a specific route. then need to add that into middleware stack like this
// app.use('/api/v1/tours' cors(), tourRouter);

// Default CORS Header (Access-Control-Allow-Origin*):
// The default implementation sets the Access-Control-Allow-Origin header to allow requests from any origin using the wildcard symbol *, meaning all domains are permitted.

// Allowing Specific Origins:
// In some cases, you may want to restrict API access to specific domains or subdomains while denying others.
// Example: API hosted at API.natours.com, front-end app at natours.com.
// Then use this configuration : an object is passed with options, specifying the allowed origin.
// app.use(cors({ origin: 'https://www.natours.com' }));

// Configuring CORS Options:
// CORS can be configured to allow requests only from specific origins.
// Example: app.use(cors({ origin: 'https://www.natours.com' })).

// Handling Simple and Non-Simple Requests in CORS:
// Simple Requests (GET and POST):
// Simple requests like GET and POST are handled by the default CORS setup.
// The Access-Control-Allow-Origin header is set to allow requests from any origin using the wildcard symbol *.

// Non-Simple Requests (PUT, PATCH, DELETE, or with Cookies/Nonstandard Headers):
// Non-simple requests require a preflight phase to determine if the actual request is safe to send.
// The browser automatically issues an OPTIONS request before the actual request.
// The server must respond to the OPTIONS request with the appropriate CORS headers.

// Preflight Phase and CORS Middleware:
// Developers need to respond to the OPTIONS request on the server.
// Define an OPTIONS route and send back the Access-Control-Allow-Origin header.
app.options('*', cors()); // Handles preflight phase for all routes
// Optional: Restrict Preflight Handling to Specific Routes:
// Preflight handling can be limited to specific routes using app.options.
// Example: app.options('api/v1/tours/:id', cors());
// This ensures that complex requests (PUT, PATCH, DELETE) are only allowed for the specified route.

// Understanding app.options:
// app.options is an HTTP method, not for setting application options.
// Used to define how the server responds to OPTIONS requests.
// In this case, it's utilized to handle the CORS preflight phase.
