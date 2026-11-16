import EventCoordinatorHomePage from '@/app/pages/event-coordinator/home';
import RoleHomeSwitch from '@/app/components/glass/home/RoleHomeSwitch';

export default function Page() {
  return (
    <RoleHomeSwitch role="event-coordinator">
      <EventCoordinatorHomePage />
    </RoleHomeSwitch>
  );
}
