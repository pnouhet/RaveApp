import { registerRootComponent } from 'expo';
import { useFonts, ClimateCrisis_400Regular } from '@expo-google-fonts/climate-crisis';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import { store, persistor } from './src/store';
import TabNavigator from './src/navigation/TabNavigator';

const FONT = 'ClimateCrisis_400Regular';
export { FONT };

function App() {
  const [fontsLoaded] = useFonts({ ClimateCrisis_400Regular });

  const loading = (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );

  if (!fontsLoaded) return loading;

  return (
    <Provider store={store}>
      <PersistGate loading={loading} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}

registerRootComponent(App);
