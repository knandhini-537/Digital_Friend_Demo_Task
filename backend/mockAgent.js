
export function getMockResponse(userMessage) {
  const query = userMessage.toLowerCase();
  
  
  if (query.match(/\b(hi|hello|hey|greetings|morning|evening|afternoon)\b/)) {
    return "Hello! Welcome to Digital Friend. I'm your virtual support assistant. How can I help you with your digital marketing, design, or development needs today?";
  }
  
  
  if (query.includes('service') || query.includes('what do you do') || query.includes('offer') || query.includes('work') || query.includes('capabilities')) {
    return "At Digital Friend, I provide a full suite of digital solutions to help your business grow online: \n\n" +
           "1. **Digital Marketing & SEO**: Result-driven campaigns, social media marketing, and search optimization.\n" +
           "2. **Web Design & Development**: Modern, responsive, and user-friendly websites.\n" +
           "3. **Branding & Graphic Design**: Logos, visual identity, and creative media.\n\n" +
           "Would you like to discuss a project in one of these areas?";
  }

  
  if (query.includes('marketing') || query.includes('seo') || query.includes('social media') || query.includes('traffic') || query.includes('google')) {
    return "My digital marketing team focuses on maximizing your ROI. I offer complete Search Engine Optimization (SEO) to boost rankings, targeted social media campaigns, and online marketing strategies tailored to Small & Medium Enterprises (SMEs) and fintech companies. How can I help grow your online presence?";
  }

  
  if (query.includes('website') || query.includes('web') || query.includes('develop') || query.includes('design') || query.includes('coding')) {
    return "I design and develop high-performance, mobile-responsive websites. From corporate sites to complex web applications, my engineering team uses modern frameworks (like React, Next.js, and Node.js) to deliver secure, visually striking, and fast user experiences. What type of website are you looking to build?";
  }

  
  if (query.includes('brand') || query.includes('logo') || query.includes('graphic') || query.includes('creative')) {
    return "My creative design team builds memorable brand identities. I handle everything from logo design and brand books to marketing collaterals and interface designs (UI/UX). I make sure your brand stands out and communicates your values clearly. Can I help you design something?";
  }

  
  if (query.includes('contact') || query.includes('phone') || query.includes('number') || query.includes('email') || query.includes('call') || query.includes('location') || query.includes('address') || query.includes('where')) {
    return "You can reach me through multiple channels:\n\n" +
           "📧 **Email**: hr.digitalfriend@gmail.com (for careers) or mail@digitalfriend.in\n" +
           "📞 **Phone**: +91 9898310052 / +91 76006 07446\n" +
           "📍 **Location**: Ahmedabad, Gujarat, India\n" +
           "🌐 **Website**: [digitalfriend.in](https://digitalfriend.in)\n\n" +
           "Feel free to shoot me an email or drop a message; I'll respond within 24 business hours!";
  }

  
  if (query.includes('job') || query.includes('career') || query.includes('intern') || query.includes('hiring') || query.includes('apply') || query.includes('work there')) {
    return "I am always looking for passionate talent! If you are interested in joining my team as an AI Developer, UI/UX Designer, or Marketing Intern, please email your resume and portfolio to **hr.digitalfriend@gmail.com** with the subject line format: `[Application] Job Title - Your Name`. I look forward to seeing your work!";
  }

  
  if (query.includes('price') || query.includes('cost') || query.includes('rate') || query.includes('charge') || query.includes('fees') || query.includes('quote')) {
    return "My pricing depends entirely on your project's scope, features, and requirements. I offer flexible packages tailored for startups and small-to-medium businesses. Please contact me at mail@digitalfriend.in or call +91 9898310052 for a free custom quotation. I'd love to help you budget!";
  }

  
  if (query.includes('digital friend') || query.includes('who are you') || query.includes('about')) {
    return "Digital Friend is a premier digital marketing, web design, and branding agency based in Ahmedabad, Gujarat. I specialize in helping small-to-medium businesses (SMEs) and fintech startups scale their online presence, enhance brand engagement, and drive revenue through technology. Let me know if you have questions about my services!";
  }

  
  if (query.includes('thank') || query.includes('thanks') || query.includes('appreciate') || query.includes('great')) {
    return "You are very welcome! It's my pleasure to help. If you have any other questions about Digital Friend's services or need anything else, feel free to ask. Have a wonderful day!";
  }

  
  return "Thank you for contacting Digital Friend support. I'm here to assist you with my web development, digital marketing, and design services. Could you please provide a few more details about your inquiry so I can direct you to the right solution?";
}
