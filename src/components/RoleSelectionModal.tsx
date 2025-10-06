import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: "employee" | "manager") => void;
}

export function RoleSelectionModal({ isOpen, onClose, onSelectRole }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<"employee" | "manager" | null>(null);

  const handleConfirm = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Vyberte svou pozici
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Pro personalizované poradenství potřebujeme vědět, jakou máte pozici ve firmě.
          </p>
          
          <RadioGroup 
            value={selectedRole || ""} 
            onValueChange={(value) => setSelectedRole(value as "employee" | "manager")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="employee" id="employee" />
              <Label htmlFor="employee" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Zaměstnanec</div>
                  <div className="text-sm text-muted-foreground">
                    Pracuji jako člen týmu
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="manager" id="manager" />
              <Label htmlFor="manager" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Manažer</div>
                  <div className="text-sm text-muted-foreground">
                    Vedu tým nebo oddělení
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Zrušit
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedRole}
              className="flex-1 bg-gradient-accent text-white"
            >
              Pokračovat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}