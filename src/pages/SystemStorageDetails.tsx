import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, HardDrive, Image, Video, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

const SystemStorageDetails = () => {
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStorageDetails();
  }, []);

  const fetchStorageDetails = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;

      const bucketsWithFiles = await Promise.all(
        (data || []).map(async (bucket) => {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list();
          
          return {
            ...bucket,
            fileCount: files?.length || 0,
            public: bucket.public
          };
        })
      );

      setBuckets(bucketsWithFiles);
    } catch (error: any) {
      console.error('Error fetching storage details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch storage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBucketIcon = (name: string) => {
    if (name.includes('image') || name.includes('car')) return <Image className="h-5 w-5" />;
    if (name.includes('video')) return <Video className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/system-health")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to System Health
      </Button>

      <h1 className="text-3xl font-bold mb-6">Storage System Details</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buckets</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buckets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buckets.reduce((sum, b) => sum + b.fileCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Status</CardTitle>
            <HardDrive className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <Badge variant="default">Online</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {buckets.map((bucket) => (
              <div key={bucket.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  {getBucketIcon(bucket.name)}
                  <div>
                    <p className="font-medium">{bucket.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {bucket.fileCount} files
                    </p>
                  </div>
                </div>
                <Badge variant={bucket.public ? "default" : "secondary"}>
                  {bucket.public ? "Public" : "Private"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStorageDetails;
