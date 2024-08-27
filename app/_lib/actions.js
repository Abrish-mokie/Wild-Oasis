'use server';

import { revalidatePath } from 'next/cache';
import { auth, signIn, signOut } from './auth';
import { supabase } from './supabase';
import { getBooking } from './data-service';
import { redirect } from 'next/navigation';

export async function signInAction() {
  await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function updateGuest(FormData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const nationalID = FormData.get('nationalID');
  const [nationality, countryFlag] = FormData.get('nationality').split('%');

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error('National ID is invalid');

  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session.user.guestId);

  revalidatePath('/account/profile');

  if (error) throw new Error('Guest could not be updated');

  return data;
}

export async function deleteBooking(bookingId) {
  const session = await auth();
  const booking = await getBooking(bookingId);

  if (!session) throw new Error('You must be logged in');
  if (booking?.guestId !== session.user.guestId) {
    throw new Error("You don't have permission to delete this booking");
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  revalidatePath('/account/reservations');

  if (error) {
    console.error(error);
    throw new Error('Booking could not be deleted');
  }
}

export async function updateReservation(FormData) {
  const session = await auth();
  const guestId = FormData.get('guestId');

  if (!session) throw new Error('You must be logged in');
  if (Number(guestId) !== session.user.guestId) {
    throw new Error("You don't have permission to update this booking");
  }

  const id = FormData.get('id');
  const numGuests = Number(FormData.get('numGuests'));
  const observations = FormData.get('observations').slice(0, 1000);

  const updatedFields = { numGuests, observations };
  console.log(updatedFields);

  const { error } = await supabase
    .from('bookings')
    .update(updatedFields)
    .eq('id', id);

  if (error) {
    console.error(JSON.stringify(error, null, 2));
    throw new Error(`Booking could not be updated`);
  }
  revalidatePath(`/account/reservations/edit/${id}`);
  revalidatePath('/account/reservations');
  redirect('/account/reservations');
}

export async function createBooking(bookingData, FormData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(FormData.get('numGuests')),
    observations: FormData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: 'unconfirmed',
  };

  const { error } = await supabase.from('bookings').insert([newBooking]);
  console.log(error ?? 'No errors');
  if (error) throw new Error(`Booking could not be created ${error}`);

  revalidatePath(`/cabings/${bookingData.cabinId}`);

  redirect('/cabins/thankyou');
}
