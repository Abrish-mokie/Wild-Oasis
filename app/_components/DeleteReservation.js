'use client';
import { TrashIcon } from '@heroicons/react/24/solid';
import SpinnerMini from './SpinnerMini';

function DeleteReservation({
  bookingId,
  isPending,
  startTransition,
  onDelete,
}) {
  function handleDelete() {
    if (confirm('Are you sure to delete this reservation?'))
      startTransition(() => {
        onDelete(bookingId);
      }); // delete reservation from supabase and update state to pending.
  }

  return (
    <button
      onClick={handleDelete}
      className='group flex items-center gap-2 uppercase text-xs font-bold text-primary-300 flex-grow px-3 hover:bg-accent-600 transition-colors hover:text-primary-900'
    >
      {!isPending ? (
        <>
          <TrashIcon className='h-5 w-5 text-primary-600 group-hover:text-primary-800 transition-colors' />
          <span className='mt-1'>Delete</span>
        </>
      ) : (
        <SpinnerMini />
      )}
    </button>
  );
}

export default DeleteReservation;
