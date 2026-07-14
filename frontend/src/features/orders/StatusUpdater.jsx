// features/orders/StatusUpdater.jsx
// Dropdown to transition an order's status — enforces the state machine from backend.
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus, selectOrdersLoading } from '../../redux/slices/ordersSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { VALID_STATUS_TRANSITIONS, ORDER_STATUS_LABELS } from '../../constants';
import Button from '../../components/Button/Button';
import { ChevronDown } from 'lucide-react';

const StatusUpdater = ({ order }) => {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectOrdersLoading);
  const [selected, setSelected] = useState('');
  const [remarks,  setRemarks]  = useState('');

  const transitions = VALID_STATUS_TRANSITIONS[order?.status] ?? [];

  if (!transitions.length) {
    return <p className="text-sm text-surface-400 italic">Status is final — no further transitions available.</p>;
  }

  const handleUpdate = async () => {
    if (!selected) return;
    const result = await dispatch(updateOrderStatus({ orderId: order.id, status: selected, remarks }));
    if (updateOrderStatus.fulfilled.match(result)) {
      dispatch(addToast({ message: `Status updated to ${ORDER_STATUS_LABELS[selected]}`, type: 'success' }));
      setSelected(''); setRemarks('');
    } else {
      dispatch(addToast({ message: result.payload || 'Status update failed', type: 'error' }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input-base appearance-none pr-10"
        >
          <option value="">Select next status…</option>
          {transitions.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      </div>
      <input
        type="text"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        className="input-base"
        placeholder="Remarks (optional)"
      />
      <Button onClick={handleUpdate} isLoading={isLoading} disabled={!selected} className="w-full justify-center">
        Update Status
      </Button>
    </div>
  );
};

export default StatusUpdater;
