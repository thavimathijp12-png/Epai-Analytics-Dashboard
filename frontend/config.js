/**
 * Frontend Configuration for EPAI
 * 
 * If you are deploying the frontend and backend on the same server (unified deployment),
 * you can leave window.ENV_API_URL empty. The frontend will automatically route API
 * calls to the same origin.
 * 
 * If you are deploying the frontend on a static host (like Netlify/Vercel) and the 
 * backend elsewhere (like Render/Heroku), specify the absolute backend URL below.
 * Example: window.ENV_API_URL = "https://epai-backend.onrender.com/api";
 */

window.ENV_API_URL = "";
