# HealthSync AI - Smart Healthcare Scheduling

A modern web application that uses AI to automate healthcare appointment scheduling based on insurance coverage and personal preferences.

## 🚀 Features

- **Insurance Document Processing**: AI-powered OCR extraction of insurance policy details
- **Smart Questionnaire**: Adaptive health preference assessment
- **Intelligent Scheduling**: AI-generated annual healthcare calendar
- **Provider Matching**: Optimal healthcare provider selection
- **Supabase Integration**: Ready for cloud database and authentication

## 🏗️ Architecture

The application follows a modular MVC architecture with clear separation of concerns:

```
src/
├── controllers/          # Application logic controllers
│   ├── AppController.js     # Main app coordinator
│   ├── PageManager.js       # Page navigation
│   ├── UploadController.js  # File upload handling
│   ├── QuestionnaireController.js
│   ├── CalendarController.js
│   └── ModalController.js
├── services/             # Business logic services
│   ├── DatabaseService.js   # Supabase integration
│   ├── FileUploadService.js
│   ├── InsuranceService.js
│   ├── QuestionnaireService.js
│   ├── AppointmentService.js
│   ├── ProviderService.js
│   └── SchedulingService.js
└── styles/              # CSS styles
    └── main.css
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your Supabase credentials in `.env`

5. Start development server:
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The application is designed to work with Supabase. To set up the database:

1. Create a new Supabase project
2. Click "Connect to Supabase" in the app to configure your connection
3. The app will work in demo mode without a database connection

### Database Schema

The application expects the following tables:

- `appointments` - User appointments
- `providers` - Healthcare providers
- `users` - User profiles (handled by Supabase Auth)

## 🧪 Development

### Code Organization

- **Controllers**: Handle user interactions and coordinate between services
- **Services**: Contain business logic and data operations
- **Modular Design**: Each component has a single responsibility
- **Event-Driven**: Controllers communicate through custom events

### Key Design Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Dependency Injection**: Services are injected into controllers
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **Responsive Design**: Mobile-first approach with progressive enhancement

### Adding New Features

1. Create service classes for business logic
2. Create controller classes for UI interactions
3. Register controllers in `AppController.js`
4. Add event communication between controllers

## 🔒 Privacy & Security

- PIPEDA compliant design
- Client-side data processing where possible
- Secure file upload validation
- Environment-based configuration

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Progressive Web App ready
- Mobile responsive design

## 🤝 Contributing

1. Follow the established architecture patterns
2. Write clear, documented code
3. Test thoroughly across devices
4. Maintain separation of concerns

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:
- Check the documentation
- Review the code comments
- Contact: support@healthsync.ai