import React, { useState } from 'react';
import PlanCard from '../components/PlanCard';
import { VPSPlan } from '../contexts/CartContext';

const allPlans: VPSPlan[] = [
  {
    id: 'starter',
    name: 'Starter VPS',
    cpu: 1,
    ram: 2,
    storage: 20,
    bandwidth: 1000,
    price: 9.99,
    features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Weekly Backups']
  },
  {
    id: 'basic',
    name: 'Basic VPS',
    cpu: 1,
    ram: 4,
    storage: 40,
    bandwidth: 1500,
    price: 14.99,
    features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Weekly Backups', 'Root Access']
  },
  {
    id: 'professional',
    name: 'Professional VPS',
    cpu: 2,
    ram: 4,
    storage: 50,
    bandwidth: 2000,
    price: 19.99,
    features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS']
  },
  {
    id: 'business',
    name: 'Business VPS',
    cpu: 2,
    ram: 8,
    storage: 80,
    bandwidth: 3000,
    price: 29.99,
    features: ['NVMe SSD Storage', '99.95% Uptime', 'Priority Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS', 'Private Network']
  },
  {
    id: 'enterprise',
    name: 'Enterprise VPS',
    cpu: 4,
    ram: 8,
    storage: 100,
    bandwidth: 5000,
    price: 39.99,
    features: ['NVMe SSD Storage', '99.95% Uptime', 'Priority Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS', 'Private Network', 'DDoS Protection']
  },
  {
    id: 'premium',
    name: 'Premium VPS',
    cpu: 4,
    ram: 16,
    storage: 200,
    bandwidth: 10000,
    price: 59.99,
    features: ['NVMe SSD Storage', '99.99% Uptime', 'Premium Support', 'Free SSL', 'Hourly Backups', 'Root Access', 'Multiple OS', 'Private Network', 'DDoS Protection', 'Load Balancer']
  },
  {
    id: 'ultimate',
    name: 'Ultimate VPS',
    cpu: 8,
    ram: 32,
    storage: 400,
    bandwidth: 20000,
    price: 99.99,
    features: ['NVMe SSD Storage', '99.99% Uptime', 'Premium Support', 'Free SSL', 'Hourly Backups', 'Root Access', 'Multiple OS', 'Private Network', 'DDoS Protection', 'Load Balancer', 'Dedicated IP']
  },
  {
    id: 'enterprise-max',
    name: 'Enterprise Max',
    cpu: 16,
    ram: 64,
    storage: 1000,
    bandwidth: 50000,
    price: 199.99,
    features: ['NVMe SSD Storage', '99.99% Uptime', 'Dedicated Support', 'Free SSL', 'Real-time Backups', 'Root Access', 'Multiple OS', 'Private Network', 'DDoS Protection', 'Load Balancer', 'Multiple IPs', 'Custom Configuration']
  }
];

export default function PlansPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'starter' | 'business' | 'enterprise'>('all');

  const filteredPlans = allPlans.filter(plan => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'starter') return plan.price < 20;
    if (selectedFilter === 'business') return plan.price >= 20 && plan.price < 60;
    if (selectedFilter === 'enterprise') return plan.price >= 60;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">VPS Hosting Plans</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our range of high-performance VPS hosting plans. 
            All plans include SSD storage, 24/7 support, and 99.9% uptime guarantee.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg shadow-md p-2 flex space-x-2">
            {[
              { key: 'all', label: 'All Plans' },
              { key: 'starter', label: 'Starter' },
              { key: 'business', label: 'Business' },
              { key: 'enterprise', label: 'Enterprise' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key as any)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPlans.map((plan, index) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              featured={plan.id === 'professional'} 
            />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our VPS Hosting?</h2>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Provisioning</h3>
                <p className="text-gray-600">Get your VPS up and running in under 60 seconds with our automated deployment system.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">99.9% Uptime SLA</h3>
                <p className="text-gray-600">Industry-leading uptime guarantee backed by redundant infrastructure and 24/7 monitoring.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm0 0v19.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                <p className="text-gray-600">24/7 technical support from our team of certified Linux administrators and virtualization experts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}