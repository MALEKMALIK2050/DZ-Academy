import { useState } from 'react';
import { PolicyCheckbox } from '@/components/policies/PolicyCheckbox';

export default function RegisterPage() {
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [acceptPrereq, setAcceptPrereq] = useState(false);
  const [showCguModal, setShowCguModal] = useState(false);
  const [showPrereqModal, setShowPrereqModal] = useState(false);

  // Vérification lors de la soumission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!acceptCgu) {
      alert('Vous devez accepter les Conditions Générales d\'Utilisation.');
      return;
    }
    if (!acceptPrereq) {
      alert('Vous devez accepter les prérequis techniques.');
      return;
    }
    
    // Soumettre le formulaire...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Champs d'inscription standard... */}
      
      <PolicyCheckbox
        id="accept-cgu"
        label="Je déclare avoir pris connaissance des conditions générales d'utilisation, de vente et de la politique de protection des données à caractère personnel du CB ACADEMY et les accepte sans réserve."
        checked={acceptCgu}
        onChange={setAcceptCgu}
        onViewPolicy={() => setShowCguModal(true)}
        required
      />
      
      <PolicyCheckbox
        id="accept-prereq"
        label="Je déclare avoir pris connaissance des prérequis techniques liés à l'enseignement à distance et les accepte sans réserve."
        checked={acceptPrereq}
        onChange={setAcceptPrereq}
        onViewPolicy={() => setShowPrereqModal(true)}
        required
      />
      
      <button type="submit" disabled={!acceptCgu || !acceptPrereq}>
        S'inscrire
      </button>
      
      {/* Modals pour afficher le texte complet */}
      {showCguModal && <PolicyModal ... />}
      {showPrereqModal && <PolicyModal ... />}
    </form>
  );
}