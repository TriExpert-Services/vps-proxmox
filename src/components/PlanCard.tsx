import React from 'react';
import { Check } from 'lucide-react';
import { useCart, VPSPlan } from '../contexts/CartContext';

interface PlanCardProps {
  plan: VPSPlan;
  featured?: boolean;
}

export default function PlanCard({ plan, featured = false }: PlanCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(plan);
  };

  return (
    <div className={`relative p-8 bg-white rounded-lg shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
      featured ? 'border-blue-500 transform scale-105' : 'border-gray-200 hover:border-blue-300'
    }`}>
      {featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold text-blue-600">${plan.price}</span>
          <span className="text-gray-600 ml-2">/month</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between">
          <span className="text-gray-600">CPU Cores</span>
          <span className="font-semibold">{plan.cpu} vCPU</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Memory</span>
          <span className="font-semibold">{plan.ram} GB RAM</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Storage</span>
          <span className="font-semibold">{plan.storage} GB SSD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bandwidth</span>
          <span className="font-semibold">{plan.bandwidth} GB</span>
        </div>
      </div>
      
      <div className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleAddToCart}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          featured
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        Add to Cart
      </button>
    </div>
  );
}