# HealthSync AI - Smart Healthcare Scheduling

A modern web application that uses AI to automate healthcare appointment scheduling based on insurance coverage and personal preferences.

## 🚀 Features

- **AI-Powered Insurance Analysis**: Perplexity AI analyzes insurance documents to extract coverage details
- **Dynamic Questionnaire**: AI-generated questions based on your specific insurance coverage
- **Smart Scheduling**: AI-generated annual healthcare calendar
- **Provider Matching**: Optimal healthcare provider selection
- **User Preferences Persistence**: Save progress across sessions
- **Supabase Integration**: Cloud database and authentication

## 🤖 AI Integration

### Perplexity AI Document Analysis
- Automatically extracts health coverage categories from insurance documents
- Uses the prompt: "Summarize in point form each non-acute benefit the user has, such as massage or dental, that they can use voluntarily each year"
- Identifies coverage percentages, annual limits, and frequencies
- Generates personalized questionnaires based on your specific coverage
- Provides confidence scoring for analysis accuracy

### Dynamic Health Categories
The system intelligently identifies various health coverage categories including:
- Dental Care
- Vision Care
- Physiotherapy
- Massage Therapy
- Mental Health Services
- Chiropractic Care
- Naturopathic Medicine
- Acupuncture
- Podiatry
- Osteopathy
- And more based on your specific policy

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
│   ├── PerplexityService.js # AI document analysis
│   ├── UserPreferencesService.js # User data persistence
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
- Perplexity AI API key
- Supabase project (optional)

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

4. Configure your environment variables in `.env`:
   ```env
   # Supabase Configuration (optional)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Perplexity AI Configuration (required for AI features)
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
   ```

5. Get your Perplexity AI API key:
   - Visit [Perplexity AI Settings](https://www.perplexity.ai/settings/api)
   - Create an account if you don't have one
   - Generate an API key
   - Add it to your `.env` file

6. Start development server:
   ```bash
   npm run dev
   ```

## 🤖 AI Configuration

### Perplexity AI Setup

1. **Create Account**: Sign up at [perplexity.ai](https://perplexity.ai)
2. **Get API Key**: 
   - Go to [API Settings](https://www.perplexity.ai/settings/api)
   - Generate a new API key
   - Copy the key to your `.env` file as `VITE_PERPLEXITY_API_KEY`

### AI Features

- **Document Analysis**: Automatically extracts health coverage information from insurance documents
- **Dynamic Questionnaires**: Generates personalized questions based on your coverage
- **Confidence Scoring**: Provides accuracy indicators for AI analysis
- **Fallback Support**: Works with demo data when AI is unavailable

### Testing AI Integration

1. **With API Key**: Upload any document to see real Perplexity AI analysis
2. **Without API Key**: The app will show demo data and explain how to configure AI
3. **Demo Mode**: Click "Try Demo" to see sample AI analysis results

## 🗄️ Database Setup

The application works with or without a database:

### With Supabase (Recommended)
1. Create a new Supabase project
2. Add your Supabase URL and anon key to `.env`
3. Run the provided migrations to set up the database schema
4. User preferences and data will be saved to the cloud

### Without Database (Local Mode)
1. Leave Supabase variables empty in `.env`
2. The app will use localStorage for data persistence
3. All features work, but data is stored locally only

## 🧪 Development

### Code Organization

- **Controllers**: Handle user interactions and coordinate between services
- **Services**: Contain business logic and data operations
- **Modular Design**: Each component has a single responsibility
- **Event-Driven**: Controllers communicate through custom events
- **AI Integration**: Perplexity AI service for intelligent document analysis

### Key Design Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Dependency Injection**: Services are injected into controllers
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **Responsive Design**: Mobile-first approach with progressive enhancement
5. **AI-First**: Intelligent analysis with graceful fallbacks

### Adding New Features

1. Create service classes for business logic
2. Create controller classes for UI interactions
3. Register controllers in `AppController.js`
4. Add event communication between controllers
5. Consider AI integration opportunities

## 🔒 Privacy & Security

- PIPEDA compliant design
- Client-side data processing where possible
- Secure file upload validation
- Environment-based configuration
- AI processing with privacy considerations
- API keys stored securely in environment variables

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Progressive Web App ready
- Mobile responsive design
- Graceful degradation for AI features

## 🚀 Deployment

The app is deployed at: https://healthcalai.netlify.app

To deploy your own instance:
1. Fork this repository
2. Connect to Netlify or Vercel
3. Add your environment variables in the deployment settings
4. Deploy!

## 🤝 Contributing

1. Follow the established architecture patterns
2. Write clear, documented code
3. Test thoroughly across devices
4. Maintain separation of concerns
5. Consider AI integration opportunities

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:
- Check the documentation
- Review the code comments
- Contact: support@healthsync.ai

## 🙏 Acknowledgments

- Powered by [Perplexity AI](https://perplexity.ai) for intelligent document analysis
- Built with [Supabase](https://supabase.com) for backend services
- Deployed on [Netlify](https://netlify.com)

## 🔧 Troubleshooting

### AI Analysis Not Working
1. Check that `VITE_PERPLEXITY_API_KEY` is set in your environment
2. Verify your API key is valid at [Perplexity Settings](https://www.perplexity.ai/settings/api)
3. Check browser console for error messages
4. Try the demo mode to test the interface

### File Upload Issues
1. Ensure file is under 10MB
2. Use supported formats: PDF, JPG, PNG
3. Check browser console for validation errors

### Database Connection Issues
1. Verify Supabase credentials in `.env`
2. Check Supabase project status
3. App will work in local mode without database