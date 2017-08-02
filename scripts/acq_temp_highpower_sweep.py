"""                        Generic data acquisition code.
                               ===  USER CODE  ===
      Author: MJS             Date: 2017-04-13                 Version: 0_0_4

This is written on top of the qtlab code and could not be done without it.
Much of the hard work has already been done, this just provides a nice
interface.

"""
import numpy as np
import mjspylab
reload(mjspylab) #testing only
import math,json,codecs,datetime,qt,sys,time

#make a dictionary of all the devices used.
devices = {#'lockin1': qt.instruments.get('lockin1')
           #'keithley1': qt.instruments.get('keithley1'),
           #'keithley2': qt.instruments.get('keithley2'),
           'keithley3': qt.instruments.get('keithley3'),
           'keithley4': qt.instruments.get('keithley4'),
           #'magnet': qt.instruments.get('magnet'),
           #'Zmagnet' :  qt.instruments.get('Zmagnet')
           'ivvi': qt.instruments.get('ivvi'),
}

# which folder to save data too
data_folder = 'D:\\microkelvin\\Run2\\data\\'

# describe this data file with words and sentences
description = """Getting a new calibration for the chip CuOx, back RuOx, and the CMN, and LCMN.
The LCMN here is new on the bridge.

Ch 2 MC S0005
Ch 4 LMMN <-- new!
Ch 5 RuOx Back
Ch 6 CMN
Ch 7 RuOx Chip
"""

# use this to save structured data about the experiment
attributes = {'sample': 'Cu Cu Ge varnish sample 2', # the sample number
         'title'      :'Thermal Conductivity', #a title for this data set
         'subtitle'   :'', # extra bit of infomation
         'series'     :'Thermaliser development', # a series of measurements as part of a group.
         'tags'       :['Temperature Sweep','Power Sweep','Thermaliser'], #keywords for searching for files later , gate_sweep iv_sweep
         'author'     :'MJS',
         'copyright'  : 'internal - not for public release',
         'fridge'     : 'Big Frossati', # What fridge it is being measured in
         'description': description,
         'fabricator' : 'MJS', # people who made it
         'operator'   : 'MJS', # people measuring it
        # save other data that is relivant for you!
        # connection lines? orientation? 
        
        }

        


# save the state of the ivvi rack. unfotunatally this is all done by hand... . .boo . . ..
attributes['ivvi rack'] = {'Dac2 voltage output gain V/V': 100e-3,
                           'Dac2 current input gain V/A': 1e6,
                           'Dac1 current output gain A/V': 1e-3,
                           'Vmeas input gain V/V': 100,
                           }
    
#this is a list of dictionaries describing what will change during the experiment.
# typically these are just the ivvi dacs or lockin amplitude, or frequencies.
# This can be as many devices as you want.
# The dictionaries are only the coordinate name followed by an array of the values. 
# The aquisition code will loop through all possible combinations for n-degrees of freedom.
# (you don't have to write nested for loops)
coordinates=[
            #{'name':'Repeats','range':[1,2]},
            #{'name':'Frequency / Hz','range':np.linspace(1000,10000,30)},
            #{'name':'Amplitude / V','range':np.linspace(0.004,0.1,10)},
            {'name':'IVVI Dac1 / mV','range':np.linspace(100,1500,15)},
            {'name':'IVVI Dac2 / mV','range':np.linspace(0,200,6)   },
            {'name':'Repeats','range':[1,2,3]},
             ]



             
# common things to change are the Dacs and frequencys and amplitudes.

# ranges are usually
# [1,2,3] # just type it by hand
# np.linspace(100,200,50) from 100 to 200 with 50 datapoints (inclusive of the endpoints)
# build complex arrays like np.append(np.linspace(100,200,50),np.linspace(200,100,50))
# which goes up and then down again.
             
# change the  three functions to do what you want.


# do stuff before the running the aquisition loop..
# this can set up the gates in a particular way
# we can also read in auxrilary files and return a dict to save useful enviromental
#values like the fridge temperature.

def setupFunction():
    devices['ivvi'].set_dacs_zero()
    #devices['magnet'].set_field(0)
    #devices['lockin1'].set_amplitude(0)
    time.sleep(1)
    
    #return a dict of things. the things can be other dicts too... 
    return { 'Keithley 3 Offset' : devices['keithley3'].get_readnextval(),
            'Keithley 4 Offset' : devices['keithley4'].get_readnextval()}

# coordinates is a dict of the coordinates for this current measurment.
# if you set 'IVVI Dac 2 / mV' as a range [100,200,300] then you can expect
# for example coordinates['IVVI Dac 2 / mV'] as 200 in one loop.
# it is up to you to decide what to do with the coordinates.
# save anything you want into the results dictionary including
# calculated values and measured values, raw values and values with gain applied
# data is cheap, save everything relivant.

def acqFunction(coordinates,results,prev_coordinates,prev_result,user_storage):
    'change the coordinates'
    
    results['Datetime Start'] = datetime.datetime.utcnow().isoformat()+'Z'
    
    devices['ivvi'].set_dac2(coordinates['IVVI Dac2 / mV'])
    devices['ivvi'].set_dac1(coordinates['IVVI Dac1 / mV'])
    
    results['MC Heater Current / A'] =  coordinates['IVVI Dac1 / mV'] / 1000 * attributes['ivvi rack']['Dac1 current output gain A/V']
    results['MC Heater Power / W (R=100)'] =  results['MC Heater Current / A']**2 / 100
    #wait between chip power changes
    
    if prev_coordinates['IVVI Dac1 / mV'] != coordinates['IVVI Dac1 / mV']:
         time.sleep(60*10)
         
    if prev_coordinates['IVVI Dac2 / mV'] != coordinates['IVVI Dac2 / mV']:
         time.sleep(60*3)
    
    #wait between repeats
    time.sleep(60*2)
    
    results['Datetime Measure'] = datetime.datetime.utcnow().isoformat()+'Z'
    #k3 = devices['keithley3'].get_readnextval()
    k4 = devices['keithley4'].get_readnextval()
    #results['keithley3'] = k3
    results['keithley4'] = k4
    
    #results['Heater Current / A'] =  k3 / attributes['ivvi rack']['Dac2 current input gain V/A']
    results['Heater Voltage / V'] =  k4 / attributes['ivvi rack']['Vmeas input gain V/V']
    results['Heater Power / W'] = results['Heater Voltage / V'] * results['Heater Voltage / V'] / 127
    
    #read the last line from the thermometary...
    results['Thermometary'] = mjspylab.readAuxrillaryLine('C:\\avs-47\\LogAVS___2017-07-27-10-48-48_6.dat')  
    
    results['Datetime End'] = datetime.datetime.utcnow().isoformat()+'Z'
    return True # keep going or stop early.

# the reset function is called last to reset everything back to a good state.
def resetFunction(measurement):
    devices['ivvi'].set_dacs_zero()
    #devices['magnet'].set_field(0)
    #devices['lockin1'].set_amplitude(0)
    return {}


#you are done setting up
# below is faff.


#returns a dictionary that is the same as the saved JSON
result = mjspylab.aquireData(devices=devices,
                  coordinates=coordinates,
                  acqFunction=acqFunction, # inside the main loop
                  resetFunction=resetFunction,
                  setupFunction=setupFunction,
                  data_folder = data_folder,
                  save_backwards_compatable_files = True,
                  save_self_script = False,
                  show_live_plot = True,
                  attributes=attributes # the attributes and metadata.
                )




