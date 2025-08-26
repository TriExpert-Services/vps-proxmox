import React from 'react';
import { Server, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Server className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">CloudVPS Pro</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Professional VPS hosting solutions with enterprise-grade infrastructure. 
              Reliable, scalable, and secure virtual private servers for your business needs.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-400" />
                <span className="text-sm">support@cloudvpspro.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-blue-400 transition-colors">VPS Hosting</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Dedicated Servers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Cloud Storage</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Backup Solutions</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Status Page</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2025 CloudVPS Pro. All rights reserved. Powered by Proxmox VE.
          </p>
        </div>
      </div>
    </footer>
  );
}