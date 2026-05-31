import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import RaveScreen from '../screens/RaveScreen';

const Tab = createMaterialTopTabNavigator();

// Material Top Tabs with swipe gesture between the 3 main screens.
export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#222222',
        tabBarInactiveTintColor: '#bbbbbb',
        tabBarIndicatorStyle: { backgroundColor: '#352360' },
        tabBarStyle: { backgroundColor: '#fff', elevation: 4, paddingTop: 30 },
        tabBarLabelStyle: { fontFamily: 'ClimateCrisis_400Regular', fontSize: 13 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="wifi-outline" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarLabel: 'Record',
          tabBarIcon: ({ color }) => (
            <Ionicons name="mic-outline" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RAVE"
        component={RaveScreen}
        options={{
          tabBarLabel: 'RAVE',
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes-outline" size={18} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}