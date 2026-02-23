# Catat Jualan

Aplikasi pencatatan penjualan dan pengeluaran. Setelah masuk (sign in) atau daftar (register), Anda bisa mencatat penjualan, biaya, mengelola produk, dan melihat ringkasan.

---

## How to run this project (step by step)

You need **two things** running: the **server** (remembers users and handles sign in/register) and the **website** (what you see in the browser). Use two terminals.

1. **Open a terminal** in the project folder (the folder that contains `package.json` and the `server` folder).

2. **Install website dependencies**  
   Run: `npm install`

3. **Install server dependencies**  
   Run: `cd server` then `npm install`, then `cd ..` to go back to the project folder.

4. **Start the server**  
   In the **first** terminal:  
   - Run: `cd server`  
   - Run: `npm run dev`  
   - Leave this terminal open. The server will listen on a port (e.g. 3000).

5. **Start the website**  
   Open a **second** terminal in the project folder, then run:  
   - `npm run dev`  
   - The app will start (e.g. at http://localhost:8080).

6. **Open the app in your browser**  
   Go to the address shown (e.g. http://localhost:8080).

7. **Use the app**  
   - First time: complete the short onboarding, then **Daftar** (register) or **Masuk** (sign in).  
   - After that you can use the app. Click the logout icon in the header when you want to sign out.

**Summary:** Two terminals — one for the server (`cd server` then `npm run dev`), one for the website (`npm run dev`). Both must be running for sign in and register to work.

**Optional:** Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` and `CORS_ORIGIN` if you need to change them. Copy `.env.example` to `.env` in the project root if you need to change the API URL (default: http://localhost:3000).

---

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
