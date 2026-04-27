import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, ShieldCheck, RefreshCw, CheckCircle2, Eye, EyeOff, LogOut, ShieldAlert, Zap, KeyRound, Sparkles } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function ForcePasswordChange() {
  const { changePassword, signOut, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  const passwordStrength = useMemo(() => {
    if (!formData.password) return 0
    let strength = 0
    if (formData.password.length >= 6) strength += 1
    if (/[A-Z]/.test(formData.password)) strength += 1
    if (/[0-9]/.test(formData.password)) strength += 1
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1
    return strength
  }, [formData.password])

  const strengthColor = [
    'bg-white/10',
    'bg-status-error',
    'bg-status-warning',
    'bg-mx-blue-500',
    'bg-status-success'
  ][passwordStrength]

  const strengthLabel = [
    'MUITO FRACA',
    'FRACA',
    'MÉDIA',
    'FORTE',
    'EXCELENTE'
  ][passwordStrength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres')
    }
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('As senhas não coincidem')
    }

    setLoading(true)
    const { error } = await changePassword(formData.password)
    setLoading(false)

    if (!error) {
      toast.success('Segurança atualizada com sucesso!')
    } else {
      toast.error(error)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-mx-md overflow-hidden" role="dialog" aria-modal="true">
      {/* Premium Background with Animated Orbs */}
      <div className="absolute inset-0 bg-[#050A09]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-mx-indigo-500/10 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="relative group">
          {/* Border Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/50 to-mx-blue-500/50 rounded-[40px] blur-xl opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-mx-3xl overflow-hidden">
            {/* Header Accent */}
            <div className="h-2 w-full bg-gradient-to-r from-brand-primary via-mx-emerald-400 to-mx-blue-500" />
            
            <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
              <header className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-primary to-mx-emerald-700 flex items-center justify-center text-white shadow-[0_0_40px_rgba(34,197,94,0.3)] mx-auto relative z-10">
                    <ShieldCheck size={48} strokeWidth={1.5} />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-10px] border border-dashed border-brand-primary/20 rounded-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Typography variant="h2" className="text-3xl font-black uppercase tracking-tighter text-white">
                    Segurança <span className="text-brand-primary">MX</span>
                  </Typography>
                  <Typography variant="body" className="text-white/60 font-medium leading-relaxed">
                    Olá, <span className="text-white font-bold">{profile?.name?.split(' ')[0]}</span>. <br/>
                    Proteja sua conta com uma nova senha de acesso.
                  </Typography>
                </div>
              </header>

              <div className="space-y-6">
                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <Typography variant="caption" className="font-black uppercase tracking-widest text-white/40 text-[10px]">Nova Credencial</Typography>
                    {formData.password && (
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-12 rounded-full overflow-hidden bg-white/5")}>
                          <motion.div 
                            className={cn("h-full transition-all duration-500", strengthColor)} 
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          />
                        </div>
                        <span className={cn("text-[9px] font-black tracking-tighter", strengthColor.replace('bg-', 'text-'))}>
                          {strengthLabel}
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-brand-primary transition-colors z-10" />
                    <Input 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="NOVA SENHA" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="!h-16 !pl-14 !pr-14 !bg-white/5 !border-white/10 !rounded-2xl !text-white !font-bold !tracking-[0.2em] focus:!border-brand-primary/50 focus:!ring-brand-primary/20 transition-all placeholder:text-white/10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors z-10"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Typography variant="caption" className="px-2 font-black uppercase tracking-widest text-white/40 text-[10px]">Confirmação</Typography>
                  <div className="relative group/input">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-brand-primary transition-colors z-10" />
                    <Input 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="REPETIR SENHA" 
                      value={formData.confirmPassword} 
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      className="!h-16 !pl-14 !bg-white/5 !border-white/10 !rounded-2xl !text-white !font-bold !tracking-[0.2em] focus:!border-brand-primary/50 focus:!ring-brand-primary/20 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Sparkles size={16} />
                </div>
                <p className="text-[10px] text-white/40 uppercase font-black leading-relaxed tracking-tight">
                  Sua nova senha será validada pela malha de segurança <span className="text-white">MX PERFORMANCE</span>. 
                  Use símbolos e números para maior proteção.
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-16 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.2)] bg-brand-primary hover:bg-brand-primary-hover font-black uppercase tracking-[0.2em] text-white flex items-center justify-center transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <>
                      SALVAR E ACESSAR <Zap size={18} className="ml-3 fill-white" />
                    </>
                  )}
                </Button>
                
                <button 
                  type="button"
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 text-white/20 hover:text-status-error font-black uppercase tracking-[0.15em] text-[10px] py-2 transition-colors"
                >
                  <LogOut size={14} /> SAIR DA CONTA
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
