import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Category } from "@shared/schema";

interface EditCategoryModalProps {
  category: Category | null;
  open: boolean;
  onClose: () => void;
}

export function EditCategoryModal({ category, open, onClose }: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("box");
  const [color, setColor] = useState("blue");
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    }
  }, [category]);

  const updateCategoryMutation = useMutation({
    mutationFn: async (updates: { name: string; icon: string; color: string }) => {
      if (!category) return;
      const res = await apiRequest("PUT", `/api/categories/${category.id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated successfully" });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }

    updateCategoryMutation.mutate({
      name: name.trim(),
      icon,
      color,
    });
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="categoryIcon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">💻 Laptop</SelectItem>
                  <SelectItem value="utensils">🍴 Utensils</SelectItem>
                  <SelectItem value="key">🔑 Key</SelectItem>
                  <SelectItem value="box">📦 Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="categoryColor">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">🔵 Blue</SelectItem>
                  <SelectItem value="green">🟢 Green</SelectItem>
                  <SelectItem value="yellow">🟡 Yellow</SelectItem>
                  <SelectItem value="purple">🟣 Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateCategoryMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
