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
