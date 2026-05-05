/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  longDescription: string;
}

export interface Project {
  id: string;
  title: string;
  category: 'residential' | 'commercial' | 'institutional';
  image: string;
  images?: string[];
  roi: string;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export interface Product {
  id: string;
  title: string;
  price: string;
  category: string;
  image: string;
  description: string;
  promoExpiry?: string;
}
