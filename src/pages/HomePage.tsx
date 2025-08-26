import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Clock, Users, Server, Database, Globe } from 'lucide-react';
import PlanCard from '../components/PlanCard';

const featuredPlans = [
  {
    id: 'starter',
    name: 'Starter VPS',
    cpu: 1,
    ram: 2,
    storage: 20,
    bandwidth: 1000,
    price: 9.99,
    features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL']
  },
  {
    id: 'professional',
    name: 'Professional VPS',
    cpu: 2,
    ram: 4,
    storage: 50,
    bandwidth: 2000,
    price: 19.99,
    features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Daily Backups']
  },
  {
    id: 'enterprise',
    name: 'Enterprise VPS',
    cpu: 4,
    ram: 8,
    storage: 100,
    bandwidth: 5000,
    price: 39.99,
    features: ['NVMe SSD Storage', '99.95% Uptime', 'Priority Support', 'Free SSL', 'Daily Backups', 'DDoS Protection']
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Enterprise-Grade VPS Hosting
              <span className="block text-blue-300">Powered by Proxmox</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Deploy high-performance virtual private servers in seconds. 
              Scalable infrastructure with 99.9% uptime guarantee and enterprise-grade security.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/plans"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>View Plans</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose CloudVPS Pro?</h2>
            <p className="text-xl text-gray-600">Enterprise features at competitive prices</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Deployment</h3>
              <p className="text-gray-600">Deploy VPS instances in under 60 seconds with our automated provisioning system.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">Advanced security features including DDoS protection and encrypted storage.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">99.9% Uptime</h3>
              <p className="text-gray-600">Guaranteed uptime with redundant infrastructure and 24/7 monitoring.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Expert Support</h3>
              <p className="text-gray-600">Round-the-clock technical support from our team of certified engineers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Perfect VPS Plan</h2>
            <p className="text-xl text-gray-600">Scalable solutions for every business need</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPlans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} featured={index === 1} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/plans"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
            >
              <span>View All Plans</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powered by Industry-Leading Technology</h2>
            <p className="text-xl text-gray-300">Built on enterprise-grade infrastructure</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Server className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Proxmox VE</h3>
              <p className="text-gray-300">Enterprise virtualization platform with high availability and live migration capabilities.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-green-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">NVMe SSD Storage</h3>
              <p className="text-gray-300">Ultra-fast NVMe SSD storage with enterprise-grade performance and reliability.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Network</h3>
              <p className="text-gray-300">Multiple data centers worldwide with premium network connectivity and DDoS protection.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}