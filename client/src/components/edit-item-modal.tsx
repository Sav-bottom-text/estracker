import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Item, type Category } from "@shared/schema";

interface EditItemModalProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function EditItemModal({ item, open, onClose, categories }: EditItemModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.categoryId);
    }
  }, [item]);

  const updateItemMutation = useMutation({
    mutationFn: async (updates: { name: string; categoryId: string }) => {
      if (!item) return;
      const res = await apiRequest("PUT", `/api/items/${item.id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item updated successfully" });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Please enter an item name", variant: "destructive" });
      return;
    }

    if (!categoryId) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    updateItemMutation.mutate({
      name: name.trim(),
      categoryId,
    });
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateItemMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
