# Food Delivery Web Application

A full-stack food delivery application with real-time order tracking, payment integration, and user authentication.

## Tech Stack

**Frontend:**
- React + Vite
- Redux Toolkit
- Socket.IO Client
- Axios
- React Router

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- Stripe Payment
- JWT Authentication
- Google OAuth
- Cloudinary (Image Upload)

## Features

- User authentication (JWT + Google OAuth)
- Real-time order tracking with Socket.IO
- Stripe payment integration
- Food menu management
- Shopping cart functionality
- Order history
- Image upload with Cloudinary

## Local Development

### Backend Setup
```bash
cd Bakend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Deployment

This project is configured for deployment on:
- **Frontend**: Vercel
- **Backend**: Render

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

### Backend (.env)
- `MONGODB_URI`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_ORIGIN`

### Frontend (.env)
- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`

## License

ISC
