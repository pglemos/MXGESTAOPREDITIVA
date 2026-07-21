// Container de todos os modais de transição do Quadro de Ações.
import BlockModal from "./BlockModal";
import UnblockModal from "./UnblockModal";
import ProgressModal from "./ProgressModal";
import SubmitValidationModal from "./SubmitValidationModal";
import ValidateModal from "./ValidateModal";
import ReturnModal from "./ReturnModal";
import ReopenModal from "./ReopenModal";
import CancelModal from "./CancelModal";
import DuplicateModal from "./DuplicateModal";
import TransitionGuideModal from "./TransitionGuideModal";

export default function BoardModals({ activeModal, onClose, onConfirm }) {
  const { type, action } = activeModal || {};
  const open = !!type;
  const close = () => onClose();
  const confirm = (modalType) => (id, payload) => onConfirm(modalType, id, payload);

  return (
    <>
      {type === "block" && <BlockModal action={action} open={open} onOpenChange={close} onConfirm={confirm("block")} />}
      {type === "unblock" && <UnblockModal action={action} open={open} onOpenChange={close} onConfirm={confirm("unblock")} />}
      {type === "progress" && <ProgressModal action={action} open={open} onOpenChange={close} onConfirm={confirm("progress")} />}
      {type === "submitValidation" && <SubmitValidationModal action={action} open={open} onOpenChange={close} onConfirm={confirm("submitValidation")} />}
      {type === "validate" && <ValidateModal action={action} open={open} onOpenChange={close} onConfirm={confirm("validate")} />}
      {type === "return" && <ReturnModal action={action} open={open} onOpenChange={close} onConfirm={confirm("return")} />}
      {type === "reopen" && <ReopenModal action={action} open={open} onOpenChange={close} onConfirm={confirm("reopen")} />}
      {type === "cancel" && <CancelModal action={action} open={open} onOpenChange={close} onConfirm={confirm("cancel")} />}
      {type === "duplicate" && <DuplicateModal action={action} open={open} onOpenChange={close} onConfirm={confirm("duplicate")} />}
      {type === "transitionGuide" && <TransitionGuideModal open={open} onOpenChange={close} />}
    </>
  );
}