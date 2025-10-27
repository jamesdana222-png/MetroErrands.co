'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import components
const VideoBackground = dynamic(
  () => import('@/components/ui/VideoBackground'),
  { ssr: false }
);

// Skip loading state for home page
const useSkipLoading = () => {
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    // Immediately set ready to true on client-side
    setReady(true);
  }, []);
  
  return ready;
};

export default function Home() {
  // Use the skip loading hook to prevent loading state
  const ready = useSkipLoading();
  
  // Return immediately if not ready (client-side only)
  if (!ready) {
    return null;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-primary-600">MetroErrandCo</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#services" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Services</a>
            <a href="#about" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">About</a>
            <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Testimonials</a>
            <a href="#contact" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Contact</a>
            <Link href="/track" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Track</Link>
          </nav>
          <div className="flex space-x-3">
            <Link href="/login" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium">
              LOGIN
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-white py-24 relative overflow-hidden min-h-[600px] flex items-center">
          {/* Video Background */}
          <VideoBackground overlayOpacity={0.5} />
          
          {/* Remove abstract background elements to make video more visible */}
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-full max-w-3xl mb-10 backdrop-blur-sm bg-black/30 p-8 rounded-lg shadow-2xl">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-white drop-shadow-md">Swift Errands, Smart Living</h2>
                <p className="text-xl mb-8 text-white font-bold drop-shadow-md">We specialize in providing seamless and reliable errand solutions, ensuring you stay ahead with efficient task management.</p>
                <div className="flex flex-col sm:flex-row mb-6 space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm px-4 py-2 rounded-md shadow-lg">
                    <span className="text-white font-bold text-xl mr-2">1</span>
                    <span className="text-white font-bold">On-Time Deliveries</span>
                  </div>
                  <div className="flex items-center bg-black/30 backdrop-blur-sm px-4 py-2 rounded-md shadow-lg">
                    <span className="text-white font-bold text-xl mr-2">2</span>
                    <span className="text-white font-bold">Cost-Effective Solutions</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                  <a href="#contact" className="px-6 py-3 bg-white text-primary-600 rounded-md font-medium hover:bg-gray-100 transition-colors text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Request Service
                  </a>
                  <a href="#services" className="px-6 py-3 border-2 border-white text-white rounded-md font-medium hover:bg-white hover:text-primary-600 transition-colors text-center hover:shadow-lg transform hover:-translate-y-1">
                    Explore Services
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-800">Our Services</h2>
              <div className="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our solutions are tailored to meet the unique challenges of modern living, providing speed, reliability, and flexibility at every stage of your daily journey.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Personal Shopping',
                  description: 'We handle all your shopping needs with precision and care, from everyday groceries to specialty items, saving you valuable time and energy.',
                  icon: '🛒',
                  color: 'from-blue-50 to-blue-100',
                  iconBg: 'bg-blue-100',
                },
                {
                  title: 'Delivery Services',
                  description: 'Count on our reliable delivery services for packages, documents, and items of all sizes, with real-time tracking and secure handling throughout.',
                  icon: '📦',
                  color: 'from-green-50 to-green-100',
                  iconBg: 'bg-green-100',
                },
                {
                  title: 'Waiting Services',
                  description: 'Reclaim your precious time by letting our professional representatives wait in line for appointments, services, or events on your behalf.',
                  icon: '⏱️',
                  color: 'from-purple-50 to-purple-100',
                  iconBg: 'bg-purple-100',
                },
                {
                  title: 'Home Organization',
                  description: 'Transform your living or working space with our expert organization solutions, creating efficient and stylish environments tailored to your needs.',
                  icon: '🏠',
                  color: 'from-yellow-50 to-yellow-100',
                  iconBg: 'bg-yellow-100',
                },
                {
                  title: 'Event Planning',
                  description: 'From intimate gatherings to large celebrations, our comprehensive event coordination ensures memorable experiences with attention to every detail.',
                  icon: '🎉',
                  color: 'from-pink-50 to-pink-100',
                  iconBg: 'bg-pink-100',
                },
                {
                  title: 'Custom Errands',
                  description: 'Whatever your unique needs may be, our bespoke errand solutions are delivered with the highest level of professionalism and attention to detail.',
                  icon: '✅',
                  color: 'from-indigo-50 to-indigo-100',
                  iconBg: 'bg-indigo-100',
                },
              ].map((service, index) => (
                <div key={index} className={`bg-gradient-to-br ${service.color} rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white`}>
                  <div className={`text-4xl mb-6 ${service.iconBg} w-16 h-16 rounded-full flex items-center justify-center shadow-inner`}>{service.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold mb-6">About MetroErrandCo</h2>
                <p className="text-gray-600 mb-6">
                  We specialize in providing seamless and reliable errand solutions, ensuring individuals and businesses stay ahead with efficient task management and personal time optimization.
                </p>
                <p className="text-gray-600 mb-8">
                  With a team of vetted professionals, we deliver reliable, efficient, and innovative errand services while maintaining the highest standards of service quality and customer satisfaction.
                </p>
                
                <h3 className="text-xl font-semibold mb-4">Our Values</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <div className="bg-primary-100 p-2 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Reliability</h4>
                      <p className="text-gray-600 text-sm">We ensure on-time task completion and seamless errand operations, giving our clients peace of mind.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-primary-100 p-2 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Efficiency</h4>
                      <p className="text-gray-600 text-sm">We optimize routes, reduce time spent, and enhance personal productivity to maximize your valuable time.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-primary-100 p-2 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Innovation</h4>
                      <p className="text-gray-600 text-sm">We embrace the latest technologies to improve tracking, communication, and overall service quality.</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-2">500+</h3>
                    <p className="text-gray-600">Happy Clients</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-2">5,000+</h3>
                    <p className="text-gray-600">Errands Completed</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-2">50+</h3>
                    <p className="text-gray-600">Errand Specialists</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-2">4.9/5</h3>
                    <p className="text-gray-600">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-800">What Our Clients Say</h2>
              <div className="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover how our premium errand services have transformed the lives of our valued clients.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Sarah Johnson',
                  role: 'Marketing Executive',
                  quote: 'MetroErrandCo has revolutionized my work-life balance. Their reliable service has given me back precious time with my family while ensuring all my errands are handled with exceptional care.',
                  image: '/testimonial-1.svg',
                  rating: 5,
                },
                {
                  name: 'Michael Chen',
                  role: 'Tech Entrepreneur',
                  quote: 'As a business owner, efficiency is everything. MetroErrandCo\'s delivery services have become an integral part of my operations - always punctual, professional, and exceeding expectations.',
                  image: '/testimonial-2.svg',
                  rating: 5,
                },
                {
                  name: 'Emily Rodriguez',
                  role: 'Healthcare Professional',
                  quote: 'Between long hospital shifts and family responsibilities, MetroErrandCo has been my secret to maintaining sanity. Their attention to detail and personalized service is unmatched in the industry.',
                  image: '/testimonial-3.svg',
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative">
                  <div className="absolute -top-5 right-8 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {Array(testimonial.rating).fill('★').join('')}
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="font-semibold text-lg text-primary-700">{testimonial.name}</h3>
                    <p className="text-primary-600">{testimonial.role}</p>
                  </div>
                  <p className="text-gray-700 italic text-center">"<span className="font-medium">{testimonial.quote}</span>"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-800">Partner with MetroErrandCo today!</h2>
              <div className="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Looking for reliable, efficient, and personalized errand solutions? Let MetroErrandCo handle your tasks with precision and care.
              </p>
              <div className="flex flex-wrap justify-center gap-8 mt-8">
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="font-medium">Seamless Deliveries</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-3">🚚</div>
                  <p className="font-medium">Flexible Solutions</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-3">⌛</div>
                  <p className="font-medium">On-Time Performance</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <form className="space-y-6 bg-white p-8 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-6">Get In Touch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Your Email"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Subject"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-gray-700 mb-2">Message</label>
                    <textarea
                      id="message"
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Your Message"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
              <div className="md:w-1/2 bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-primary-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-gray-600">123 Errand Street, Metro City, MC 12345</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-primary-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Phone</h4>
                      <p className="text-gray-600">(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-primary-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-gray-600">info@metroerrandco.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-primary-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Business Hours</h4>
                      <p className="text-gray-600">Monday - Friday: 9am - 5pm</p>
                      <p className="text-gray-600">Saturday: 10am - 2pm</p>
                      <p className="text-gray-600">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MetroErrandCo</h3>
              <p className="mb-4">Your trusted partner for efficient, reliable, and personalized errand services in the metro area.</p>
              <div className="flex space-x-4 mt-6">
                <a href="#" className="text-white hover:text-primary-500 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-primary-500 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-primary-500 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-primary-500 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.7 3H4.3C3.582 3 3 3.582 3 4.3v15.4c0 .718.582 1.3 1.3 1.3h15.4c.718 0 1.3-.582 1.3-1.3V4.3c0-.718-.582-1.3-1.3-1.3zM8.339 18.338H5.667v-8.59h2.672v8.59zM7.004 8.574a1.548 1.548 0 11-.002-3.096 1.548 1.548 0 01.002 3.096zm11.335 9.764H15.67v-4.177c0-.996-.017-2.278-1.387-2.278-1.389 0-1.601 1.086-1.601 2.206v4.249h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.711z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-primary-500 transition-colors">About Us</a></li>
                <li><a href="#services" className="hover:text-primary-500 transition-colors">Services</a></li>
                <li><a href="#testimonials" className="hover:text-primary-500 transition-colors">Testimonials</a></li>
                <li><a href="#contact" className="hover:text-primary-500 transition-colors">Contact</a></li>
                <li><a href="/login" className="hover:text-primary-500 transition-colors">Login</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Our Services</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Grocery Shopping</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Package Delivery</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Prescription Pickup</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Dry Cleaning</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Custom Errands</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Corporate Services</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 mt-0.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>123 Errand Street, Metro City, MC 12345</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 mt-0.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>(555) 123-4567</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 mt-0.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>info@metroerrandco.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 mt-0.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Monday - Friday: 9am - 5pm<br />
                    Saturday: 10am - 2pm<br />
                    Sunday: Closed
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p>&copy; {new Date().getFullYear()} MetroErrandCo. All rights reserved.</p>
              <div className="mt-4 md:mt-0">
                <ul className="flex space-x-6">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}