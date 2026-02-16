
import React, { useState } from 'react';
import { Check, Sparkles, X, CreditCard, Loader2, ShieldCheck, Zap, Lock, Smartphone, Banknote, ArrowRight, Target, FileText, BrainCircuit } from 'lucide-react';
import { UserProfile } from '../types';

interface SubscriptionProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    appMode?: any;
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onUpdateUser }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Payment Methods: 'card' | 'ecocash' | 'innbucks'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobileNumber, setMobileNumber] = useState('');

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === 'monthly') return monthlyPrice;
    return Math.floor(monthlyPrice * 0.8);
  };

  const handleSubscribe = (planTitle: string) => {
      setSelectedPlan(planTitle);
      setShowPaymentModal(true);
      setPaymentSuccess(false);
  };

  const processPayment = () => {
      if (paymentMethod !== 'card' && mobileNumber.length < 5) {
          alert("Please enter a valid mobile number.");
          return;
      }

      setProcessing(true);
      
      // Simulate API Latency & Verification
      setTimeout(() => {
          setProcessing(false);
          setPaymentSuccess(true);
          onUpdateUser({ ...user, isSubscribed: true });
      }, 3000);
  };

  const PlanCard = ({ title, price, features, description, popular = false, color = 'indigo' }: any) => {
    const colorStyles: any = {
        purple: {
            border: 'border-purple-500/30',
            badge: 'bg-purple-600',
            button: 'bg-purple-600 hover:bg-purple-500',
            text: 'text-purple-600'
        },
        indigo: {
            border: 'border-indigo-500/30',
            badge: 'bg-indigo-600',
            button: 'bg-indigo-600 hover:bg-indigo-500',
            text: 'text-indigo-600'
        },
        emerald: {
            border: 'border-emerald-500/30',
            badge: 'bg-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-500',
            text: 'text-emerald-600'
        }
    };

    const styles = colorStyles[color] || colorStyles.indigo;

    return (
        <div className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col h-full ${
            popular 
            ? `bg-slate-900 dark:bg-slate-800 text-white shadow-2xl scale-105 z-10 border ${styles.border}` 
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:shadow-xl'
        }`}>
        {popular && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <span className={`${styles.badge} text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide uppercase shadow-lg flex items-center gap-1`}>
                    <Sparkles size={12} fill="currentColor" />
                    Best Value
                </span>
            </div>
        )}
        
        <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className={`text-sm ${popular ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{description}</p>
        </div>

        <div className="flex items-baseline mb-8">
            <span className="text-5xl font-extrabold tracking-tight">
                {typeof price === 'number' ? `$${price}` : price}
            </span>
            {typeof price === 'number' && (
                <div className="ml-2 flex flex-col">
                    <span className={`text-sm font-medium ${popular ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>/mo</span>
                </div>
            )}
        </div>

        <div className="flex-1">
            <ul className="space-y-4 mb-8">
                {features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start">
                    <div className={`mt-0.5 mr-3 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${popular ? 'bg-white/20 text-white' : `bg-slate-100 dark:bg-white/5 ${styles.text}`}`}>
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={`text-sm font-medium ${popular ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
                </li>
                ))}
            </ul>
        </div>

        <button 
            onClick={() => handleSubscribe(title)}
            className={`w-full py-4 rounded-xl font-bold transition-all transform active:scale-95 ${
            popular 
                ? `${styles.button} text-white shadow-lg` 
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
        }`}>
            {typeof price === 'number' ? 'Upgrade Now' : 'Contact Sales'}
        </button>
        </div>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24 relative animate-in fade-in">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight flex items-center justify-center gap-3">
            <ShieldCheck className="text-emerald-500" size={32} /> Secure Your Future
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
            Join 12,000+ executives and contractors dominating their markets with CareerOS.
        </p>
        
        <div className="flex justify-center mb-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex relative">
                 <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                 >
                    Monthly
                 </button>
                 <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                 >
                    Yearly (-20%)
                 </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center">
        <PlanCard 
            color="purple" 
            title="Starter" 
            price={0} 
            description="For students & entry-level." 
            features={["Basic Job Search", "1 Academy Course", "Public Profile"]} 
        />
        <PlanCard 
            color="indigo" 
            title="Executive Suite" 
            price={getPrice(49)} 
            popular={true} 
            description="For high-growth leaders." 
            features={[
                "Strategy Engine Access", 
                "AI Career Toolkit (Resume/Bid Gen)", 
                "Unlimited Academy & Simluations", 
                "Executive Coaching (AI Atlas)", 
                "Priority Matching"
            ]} 
        />
        <PlanCard 
            color="emerald" 
            title="Enterprise" 
            price="Custom" 
            description="For recruitment agencies & large firms." 
            features={["Multi-Seat License", "White-label Portal", "API Access", "Dedicated Success Manager"]} 
        />
      </div>

      {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
              <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-0 text-center animate-in zoom-in-95">
                   
                   {/* Modal Header */}
                   <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            {paymentSuccess ? <Sparkles size={18} className="text-amber-500"/> : <Lock size={18} className="text-emerald-500"/>} 
                            {paymentSuccess ? 'Welcome to the 1%' : 'Secure Checkout'}
                        </h2>
                        <button onClick={() => setShowPaymentModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>

                   <div className="p-8">
                       {paymentSuccess ? (
                          <div className="animate-in zoom-in-95">
                              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
                                  <Check size={48} strokeWidth={4} className="text-white"/>
                              </div>
                              <h2 className="text-3xl font-extrabold dark:text-white mb-2">Access Granted</h2>
                              <p className="text-slate-500 mb-8 text-lg">Your <strong>{selectedPlan}</strong> is now active.</p>
                              
                              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 mb-8 text-left border border-slate-100 dark:border-slate-700">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Unlocked Capabilities</h4>
                                  <div className="space-y-4">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><Target size={18}/></div>
                                          <div>
                                              <div className="font-bold text-sm dark:text-white">Strategy Engine</div>
                                              <div className="text-xs text-slate-500">Full analysis & roadmap generation enabled.</div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FileText size={18}/></div>
                                          <div>
                                              <div className="font-bold text-sm dark:text-white">Bid & Resume Toolkit</div>
                                              <div className="text-xs text-slate-500">AI auto-tailoring and cover letter generation.</div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><BrainCircuit size={18}/></div>
                                          <div>
                                              <div className="font-bold text-sm dark:text-white">Atlas AI Coach</div>
                                              <div className="text-xs text-slate-500">Unlimited executive coaching sessions.</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <button 
                                onClick={() => { setShowPaymentModal(false); }} 
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl flex items-center justify-center gap-2"
                              >
                                  Launch Dashboard <ArrowRight size={20}/>
                              </button>
                          </div>
                       ) : (
                           <div className="text-left">
                               <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                   <div>
                                       <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Plan</div>
                                       <div className="font-bold text-xl text-slate-900 dark:text-white">{selectedPlan}</div>
                                       <div className="text-xs text-slate-400">Billed {billingCycle}</div>
                                   </div>
                                   <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                                       ${getPrice(selectedPlan === 'Executive Suite' ? 49 : 0)}
                                   </div>
                               </div>

                               <div className="mb-6">
                                   <div className="flex gap-3 mb-4">
                                       <button 
                                            onClick={() => setPaymentMethod('card')}
                                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'card' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                                       >
                                           <CreditCard size={20} />
                                           <span className="text-xs font-bold">Card</span>
                                       </button>
                                       <button 
                                            onClick={() => setPaymentMethod('ecocash')}
                                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'ecocash' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                                       >
                                           <Smartphone size={20} />
                                           <span className="text-xs font-bold">Ecocash</span>
                                       </button>
                                       <button 
                                            onClick={() => setPaymentMethod('innbucks')}
                                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'innbucks' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                                       >
                                           <Banknote size={20} />
                                           <span className="text-xs font-bold">Innbucks</span>
                                       </button>
                                   </div>

                                   {paymentMethod === 'card' ? (
                                       <div className="space-y-4">
                                           <div className="relative">
                                               <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                               <input className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white font-mono" placeholder="Card Number" defaultValue="4242 4242 4242 4242" />
                                           </div>
                                           <div className="grid grid-cols-2 gap-4">
                                               <input className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white text-center font-mono" placeholder="MM/YY" defaultValue="12/28" />
                                               <input className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white text-center font-mono" placeholder="CVC" defaultValue="123" />
                                           </div>
                                       </div>
                                   ) : (
                                       <div className="space-y-4 animate-in fade-in">
                                           <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                               <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                   {paymentMethod === 'ecocash' ? 'Ecocash Merchant Code' : 'Innbucks Account'}
                                               </p>
                                               <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                                                   {paymentMethod === 'ecocash' ? '*151*2*2*19283#' : '882736'}
                                               </p>
                                           </div>
                                           <div className="relative">
                                               <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                               <input 
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white font-mono" 
                                                    placeholder="Enter your phone number" 
                                                    value={mobileNumber}
                                                    onChange={e => setMobileNumber(e.target.value)}
                                                />
                                           </div>
                                           <p className="text-xs text-slate-400 text-center">
                                               A payment request will be sent to your phone.
                                           </p>
                                       </div>
                                   )}
                               </div>

                               <button 
                                    onClick={processPayment} 
                                    disabled={processing} 
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                   {processing ? <Loader2 className="animate-spin" /> : `Pay $${getPrice(selectedPlan === 'Executive Suite' ? 49 : 0)} & Unlock`}
                               </button>
                               <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                                   <Lock size={10} /> 256-bit SSL Encrypted. 
                               </p>
                           </div>
                       )}
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};
