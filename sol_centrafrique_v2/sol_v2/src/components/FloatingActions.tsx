import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{ text: string, sent: boolean }[]>([
    { text: "Bonjour ! Comment pouvons-nous aider votre transition solaire aujourd'hui ?", sent: false }
  ]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setMessages(prev => [...prev, { text: chatMessage, sent: true }]);
    setChatMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        text: "Merci pour votre message ! Un expert SOL! va vous répondre sous peu. Vous pouvez aussi nous joindre directement au +236 70 00 00 00.", 
        sent: false 
      }]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 items-center">
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="w-14 h-14 bg-white border border-gray-100 text-brand-secondary rounded-2xl shadow-2xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all group"
            aria-label="Retour en haut"
          >
            <ChevronUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowChat(!showChat);
            if (navigator.vibrate) navigator.vibrate(20);
          }}
          className={`w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all ${
            showChat ? 'bg-white text-brand-secondary border border-gray-100' : 'bg-brand-primary text-brand-secondary'
          }`}
          aria-label="Chatbot"
        >
          {showChat ? <X className="h-8 w-8" /> : <MessageCircle className="h-8 w-8 animate-pulse" />}
        </motion.button>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20, x: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, x: -20 }}
              className="absolute bottom-20 right-0 w-[calc(100vw-4rem)] sm:w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden"
            >
              <div className="bg-brand-secondary p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 shadow-lg">
                    <img src="/logo_sol_centrafrique.png" alt="SOL!" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight">SOL! Assist</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">En ligne</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-brand-neutral/30">
                {messages.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={i}
                    className={`flex ${m.sent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                      m.sent 
                        ? 'bg-brand-primary text-brand-secondary rounded-tr-none' 
                        : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                    }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 bg-brand-neutral px-6 py-3 rounded-xl border border-transparent focus:border-brand-primary outline-none transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    className="bg-brand-primary text-brand-secondary p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-primary/20"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
