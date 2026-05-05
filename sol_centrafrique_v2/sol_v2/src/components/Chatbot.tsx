import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Bot, Phone, Zap, ShieldCheck } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  action?: {
    label: string;
    path: string;
  };
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Bonjour ! Je suis l'assistant SOL!. Comment puis-je vous aider aujourd'hui avec votre projet solaire ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    const currentInput = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulated Bot Response
    setTimeout(() => {
      const response = getBotResponse(currentInput);
      const botMsg: Message = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        action: response.action
      };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const getBotResponse = (text: string): { text: string; action?: { label: string; path: string } } => {
    const t = text.toLowerCase();
    
    if (t.includes('prix') || t.includes('coût')) {
      return { 
        text: "Nos équipements (panneaux, batteries, onduleurs) ont des prix variables. Vous pouvez consulter notre boutique en ligne ou demander un devis pour une installation complète.",
        action: { label: 'Voir la Boutique', path: '/shop' }
      };
    }
    
    if (t.includes('boutique') || t.includes('acheter') || t.includes('kit') || t.includes('panneau') || t.includes('batterie')) {
      return { 
        text: "Bien sûr ! Nous avons une sélection de matériel certifié Tier 1 dans notre boutique.",
        action: { label: 'Boutique SOL!', path: '/shop' }
      };
    }

    if (t.includes('devis') || t.includes('installer') || t.includes('prix installation')) {
      return { 
        text: "Pour un devis personnalisé, nous devons évaluer vos besoins énergétiques. Voulez-vous remplir notre formulaire de contact ?",
        action: { label: 'Demander un Devis', path: '/contact' }
      };
    }

    if (t.includes('contact') || t.includes('adresse') || t.includes('où')) {
      return { 
        text: "Nous sommes situés à l'Avenue de France, Bangui. Vous pouvez nous joindre par téléphone au +236 70 00 00 00.",
        action: { label: 'Nous Contacter', path: '/contact' }
      };
    }
    
    if (t.includes('merci') || t.includes('bonjour') || t.includes('salut')) {
      return { text: "Je vous en prie ! Comment puis-je vous guider dans votre transition vers l'énergie solaire aujourd'hui ?" };
    }
    
    return { 
      text: "C'est une excellente question. Pour vous répondre au mieux, je vous suggère de parler à l'un de nos ingénieurs au +236 70 00 00 00 ou de consulter nos services.",
      action: { label: 'Nos Services', path: '/services' }
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-secondary p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-brand-primary p-2 rounded-xl">
                  <Bot className="h-5 w-5 text-brand-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assistant SOL!</h3>
                  <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">En ligne</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Fermer le chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-neutral/30"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-brand-secondary text-white rounded-tr-none' 
                      : 'bg-white text-brand-secondary rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                    {msg.action && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(msg.action!.path);
                          }}
                          className="bg-brand-primary text-brand-secondary px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          {msg.action.label}
                        </button>
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setInputValue('Quel est le prix ?')}
                className="whitespace-nowrap text-[10px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-brand-primary transition-colors flex items-center gap-1 shrink-0"
              >
                <Zap className="h-3 w-3 text-brand-primary" /> Prix ?
              </button>
              <button 
                onClick={() => setInputValue('Où êtes-vous ?')}
                className="whitespace-nowrap text-[10px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-brand-primary transition-colors flex items-center gap-1 shrink-0"
              >
                <ShieldCheck className="h-3 w-3 text-brand-primary" /> Localisation ?
              </button>
              <button 
                onClick={() => setInputValue('Comment vous appeler ?')}
                className="whitespace-nowrap text-[10px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-brand-primary transition-colors flex items-center gap-1 shrink-0"
              >
                <Phone className="h-3 w-3 text-brand-primary" /> Appeler
              </button>
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                placeholder="Posez votre question..."
                className="flex-1 text-sm outline-none bg-brand-neutral px-4 py-3 rounded-xl focus:ring-1 focus:ring-brand-primary transition-all"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-brand-primary text-brand-secondary p-3 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                aria-label="Envoyer le message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-5 rounded-full shadow-2xl transition-all duration-300 relative group flex items-center gap-3 overflow-hidden ${
          isOpen ? 'bg-white text-brand-secondary ring-2 ring-brand-primary' : 'bg-brand-primary text-brand-secondary'
        }`}
        aria-label={isOpen ? "Fermer l'assistant" : "Discuter avec l'assistant"}
        aria-expanded={isOpen}
      >
        <div className="relative z-10">
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </div>
        {!isOpen && (
          <span className="max-w-0 group-hover:max-w-xs transition-all duration-500 font-bold text-sm whitespace-nowrap overflow-hidden">
            Besoin d'aide ?
          </span>
        )}
      </motion.button>
    </div>
  );
}
