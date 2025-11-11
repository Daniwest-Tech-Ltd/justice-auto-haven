import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LoyaltyStats {
  totalPurchases: number;
  totalSpent: number;
  reviewsCount: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
}

export const CustomerLoyaltyBadge = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LoyaltyStats>({
    totalPurchases: 0,
    totalSpent: 0,
    reviewsCount: 0,
    tier: 'bronze',
    points: 0
  });

  useEffect(() => {
    if (user) {
      fetchLoyaltyStats();
    }
  }, [user]);

  const fetchLoyaltyStats = async () => {
    if (!user) return;

    // Fetch purchases
    const { data: purchases } = await supabase
      .from('sales')
      .select('sale_price')
      .eq('customer_id', user.id);

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id);

    const totalPurchases = purchases?.length || 0;
    const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.sale_price), 0) || 0;
    const reviewsCount = reviews?.length || 0;

    // Calculate points and tier
    const points = (totalPurchases * 100) + (reviewsCount * 50) + Math.floor(totalSpent / 10000);
    
    let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (points >= 1000) tier = 'platinum';
    else if (points >= 500) tier = 'gold';
    else if (points >= 200) tier = 'silver';

    setStats({
      totalPurchases,
      totalSpent,
      reviewsCount,
      tier,
      points
    });
  };

  const getTierInfo = (tier: string) => {
    const info = {
      bronze: { icon: Award, color: 'text-amber-700', bg: 'bg-amber-100', name: 'Bronze Member' },
      silver: { icon: Star, color: 'text-slate-400', bg: 'bg-slate-100', name: 'Silver Member' },
      gold: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100', name: 'Gold Member' },
      platinum: { icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-100', name: 'Platinum Member' }
    };
    return info[tier as keyof typeof info];
  };

  const tierInfo = getTierInfo(stats.tier);
  const Icon = tierInfo.icon;

  return (
    <Card className="glass-strong">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${tierInfo.bg}`}>
              <Icon className={`h-6 w-6 ${tierInfo.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{tierInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{stats.points} Loyalty Points</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {stats.tier.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalPurchases}</p>
            <p className="text-xs text-muted-foreground">Purchases</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">KSH {(stats.totalSpent / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.reviewsCount}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/10">
          <p className="text-xs text-center">
            <span className="font-semibold">Next tier:</span>{' '}
            {stats.tier === 'bronze' ? 'Silver (200 pts)' :
             stats.tier === 'silver' ? 'Gold (500 pts)' :
             stats.tier === 'gold' ? 'Platinum (1000 pts)' :
             'You\'re at the highest tier! 🎉'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
